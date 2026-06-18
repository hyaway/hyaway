// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ReviewSwipeCard } from "./review-swipe-card";
import { ReviewCardContent } from "./review-card-content";
import { useReviewKeyboardShortcuts } from "./use-review-keyboard-shortcuts";
import type { SwipeDirection } from "./review-swipe-card";
import type {
  PreviousFileState,
  RatingRestoreEntry,
  RestoreData,
} from "@/stores/review-queue-store";
import type {
  ReviewFileAction,
  ReviewFileMutationAction,
  SecondarySwipeAction,
  SwipeBindings,
} from "@/stores/review-settings-store";
import type { TagRestoreEntry } from "@/integrations/hydrus-api/tag-actions";
import {
  getBindingForDirection,
  stripRatingActionsForServicesFromBindings,
  useReviewGesturesEnabled,
  useReviewImmersiveMode,
  useReviewSettingsActions,
  useReviewSwipeBindings,
  useReviewTagServiceKey,
} from "@/stores/review-settings-store";
import {
  useReviewQueueActions,
  useReviewQueueCurrentFileId,
  useReviewQueueCurrentIndex,
  useReviewQueueFileIds,
  useReviewQueueHistory,
  useReviewQueueNextFileIds,
  useReviewQueueSources,
} from "@/stores/review-queue-store";
import { hideFileIdsInViewCaches } from "@/integrations/hydrus-api/queries/file-metadata-cache";
import {
  useArchiveFilesMutation,
  useDeleteFilesMutation,
  useGetSingleFileMetadata,
  useUnarchiveFilesMutation,
  useUndeleteFilesMutation,
} from "@/integrations/hydrus-api/queries/manage-files";
import { useHydrusHideFromViewOptions } from "@/integrations/hydrus-api/queries/options";
import { useSetRatingMutation } from "@/integrations/hydrus-api/queries/ratings";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { getFileMetadata } from "@/integrations/hydrus-api/api-client";
import { useReadOnlyRatingServiceKeys } from "@/stores/ratings-settings-store";
import { Permission } from "@/integrations/hydrus-api/models";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useLocalTagServices } from "@/integrations/hydrus-api/queries/services";
import { useAddFileTagsMutation } from "@/integrations/hydrus-api/queries/tags";
import {
  TAG_ACTION_ADD,
  TAG_ACTION_DELETE,
  planTagActions,
  resolveTagServiceKey,
  tagsToRemoveOnUndo,
} from "@/integrations/hydrus-api/tag-actions";
import { getTagActions } from "@/stores/review-binding-utils";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";

/** Number of cards to render in the stack */
const STACK_SIZE = 3;
/** Number of next cards to prefetch metadata for */
const PREFETCH_COUNT = 3;

/** Card dimensions for threshold calculations */
export interface CardSize {
  width: number;
  height: number;
}

/** Container that measures deck size once and passes it to children */
function DeckContainer({
  children,
}: {
  children: (cardSize: CardSize) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState<CardSize>({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setCardSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full" data-review-deck>
      {children(cardSize)}
    </div>
  );
}

/** Check if a mutation action didn't change the file state (e.g., archiving already archived) */
function wasMutationUnchanged(
  action: ReviewFileMutationAction,
  fileState: PreviousFileState,
): boolean {
  return (
    (action === "archive" && fileState === "archived") ||
    (action === "trash" && fileState === "trashed")
  );
}

/** Mutation function signature for file management operations */
type FileMutate = (args: { file_ids: Array<number> }) => void;
/** Mutation function signature for rating operations */
type RatingMutate = (args: {
  file_id: number;
  rating_service_key: string;
  rating: boolean | number | null;
}) => void;

/**
 * Execute the primary file action if it would change state.
 * "skip" and "undo" are explicit no-ops. Mutation actions use a complete
 * (non-Partial) map so adding a new mutation action forces a compile error
 * until handled.
 */
function executeFileAction(
  fileAction: ReviewFileAction,
  fileId: number,
  fileState: PreviousFileState,
  mutations: Record<ReviewFileMutationAction, FileMutate>,
): void {
  if (fileAction === "skip" || fileAction === "undo") return;
  if (wasMutationUnchanged(fileAction, fileState)) return;
  mutations[fileAction]({ file_ids: [fileId] });
}

/**
 * Reverse a previously-applied file action for undo.
 * Maps each forward action to its inverse mutation.
 */
function reverseFileAction(
  fileAction: ReviewFileAction,
  fileId: number,
  fileState: PreviousFileState,
  undoMutations: Record<ReviewFileMutationAction, FileMutate>,
): void {
  if (fileAction === "skip" || fileAction === "undo") return;
  if (wasMutationUnchanged(fileAction, fileState)) return;
  undoMutations[fileAction]({ file_ids: [fileId] });
}

function shouldHideFromViewAfterReviewAction(
  fileAction: ReviewFileAction,
  options: {
    hideFilteredFiles: boolean;
    hideFilteredFilesEvenWhenSkipped: boolean;
  },
) {
  if (!options.hideFilteredFiles) return false;

  switch (fileAction) {
    case "archive":
    case "trash":
      return true;
    case "skip":
      return options.hideFilteredFilesEvenWhenSkipped;
    case "undo":
      return false;
    default:
      fileAction satisfies never;
      return false;
  }
}

/**
 * Execute secondary rating actions and build restore entries for undo.
 * Returns the restore entries so the caller can record them in history.
 */
function executeSecondaryRatingActions(
  secondaryActions: Array<SecondarySwipeAction>,
  fileId: number,
  ratings: Record<string, unknown> | undefined,
  validServiceKeys: Set<string>,
  setRating: RatingMutate,
): Array<RatingRestoreEntry> {
  const restoreEntries: Array<RatingRestoreEntry> = [];

  for (const action of secondaryActions) {
    switch (action.actionType) {
      case "rating": {
        const { serviceKey } = action;

        // Skip orphaned rating actions (service no longer exists)
        if (!validServiceKeys.has(serviceKey)) break;

        const currentRating = ratings?.[serviceKey] ?? null;

        if (action.type === "setLike") {
          restoreEntries.push({
            serviceKey,
            actionType: "setLike",
            previousValue: currentRating as boolean | null,
          });
          setRating({
            file_id: fileId,
            rating_service_key: serviceKey,
            rating: action.value,
          });
        } else if (action.type === "setNumerical") {
          restoreEntries.push({
            serviceKey,
            actionType: "setNumerical",
            previousValue: currentRating as number | null,
          });
          setRating({
            file_id: fileId,
            rating_service_key: serviceKey,
            rating: action.value,
          });
        } else {
          // action.type === "incDecDelta"
          const prevValue = (currentRating as number | null) ?? 0;
          restoreEntries.push({
            serviceKey,
            actionType: "incDecDelta",
            previousValue: prevValue,
          });
          setRating({
            file_id: fileId,
            rating_service_key: serviceKey,
            rating: Math.max(0, prevValue + action.delta),
          });
        }
        break;
      }
      case "addTag":
        // TODO: implement tag secondary actions
        break;
      default:
        action satisfies never;
    }
  }

  return restoreEntries;
}

export function useReviewSwipeDeck() {
  const fileIds = useReviewQueueFileIds();
  const currentIndex = useReviewQueueCurrentIndex();
  const currentFileId = useReviewQueueCurrentFileId();
  const history = useReviewQueueHistory();
  const reviewSources = useReviewQueueSources();
  const nextFileIds = useReviewQueueNextFileIds(PREFETCH_COUNT);
  const { recordAction, undo } = useReviewQueueActions();
  const bindings = useReviewSwipeBindings();

  const queryClient = useQueryClient();

  // Mutations — destructure to stable .mutate refs to avoid dep churn
  const { mutate: archiveFiles } = useArchiveFilesMutation();
  const { mutate: trashFiles } = useDeleteFilesMutation();
  const { mutate: unarchiveFiles } = useUnarchiveFilesMutation();
  const { mutate: undeleteFiles } = useUndeleteFilesMutation();
  const { mutate: setRating } = useSetRatingMutation();
  const { mutate: addFileTags } = useAddFileTagsMutation();
  const { hideFilteredFiles, hideFilteredFilesEvenWhenSkipped } =
    useHydrusHideFromViewOptions();

  // Tag service resolution + permission for secondary tag actions
  const localTagServices = useLocalTagServices();
  const tagServiceKey = useReviewTagServiceKey();
  const { hasPermission } = usePermissions();
  const canEditTags = hasPermission(Permission.EDIT_FILE_TAGS);
  const resolvedTagServiceKey = useMemo(
    () => resolveTagServiceKey(localTagServices, tagServiceKey),
    [localTagServices, tagServiceKey],
  );

  // Rating services (for filtering orphaned actions)
  const { ratingServices } = useRatingServices();
  const readOnlyServiceKeys = useReadOnlyRatingServiceKeys();
  const validServiceKeys = useMemo(
    () =>
      new Set(
        ratingServices
          .filter(([key]) => !readOnlyServiceKeys.has(key))
          .map(([key]) => key),
      ),
    [ratingServices, readOnlyServiceKeys],
  );
  const editableBindings = useMemo(
    () =>
      stripRatingActionsForServicesFromBindings(bindings, readOnlyServiceKeys),
    [bindings, readOnlyServiceKeys],
  );

  // Current file metadata
  const { data: currentMetadata } = useGetSingleFileMetadata(
    currentFileId ?? 0,
  );

  // Exit animation state - track exiting cards to keep them rendered
  const [exitingCards, setExitingCards] = useState<Map<number, SwipeDirection>>(
    new Map(),
  );

  // When true, skip exit + stack animations (set by keyboard/footer, cleared by gesture swipes)
  const skipAnimationRef = useRef(false);

  // Prefetch next cards' metadata
  useEffect(() => {
    for (const fileId of nextFileIds) {
      queryClient.prefetchQuery({
        queryKey: ["getSingleFileMetadata", fileId],
        queryFn: async () => {
          const response = await getFileMetadata([fileId]);
          if (response.metadata.length === 0) {
            throw new Error("File not found.");
          }
          return response.metadata[0];
        },
        staleTime: 30 * 1000,
      });
    }
  }, [nextFileIds, queryClient]);

  // Determine previous state for undo purposes
  const getFileState = useCallback((): PreviousFileState => {
    if (!currentMetadata) return null;
    if (currentMetadata.is_trashed) return "trashed";
    if (currentMetadata.is_inbox) return "inbox";
    return "archived";
  }, [currentMetadata]);

  // Perform undo action (separate from swipe since undo doesn't animate current card)
  const performUndo = useCallback(() => {
    if (history.length === 0) return;

    const lastEntry = undo();
    if (lastEntry) {
      const { restore, fileAction } = lastEntry;

      // Reverse file action if it actually changed the state
      reverseFileAction(fileAction, lastEntry.fileId, restore.fileState, {
        archive: unarchiveFiles,
        trash: undeleteFiles,
      });

      // Reverse rating actions
      for (const rating of restore.ratings ?? []) {
        if (readOnlyServiceKeys.has(rating.serviceKey)) continue;

        setRating({
          file_id: lastEntry.fileId,
          rating_service_key: rating.serviceKey,
          rating: rating.previousValue,
        });
      }

      // Reverse tag actions — delete only tags this swipe actually added.
      // All entries share the global service key resolved at swipe time.
      const tagsToRemove = tagsToRemoveOnUndo(restore.tags ?? []);
      if (tagsToRemove.length > 0 && restore.tags && restore.tags.length > 0) {
        addFileTags({
          file_ids: [lastEntry.fileId],
          service_key: restore.tags[0].serviceKey,
          tags: tagsToRemove,
          action: TAG_ACTION_DELETE,
        });
      }
    }
  }, [
    history.length,
    undo,
    unarchiveFiles,
    undeleteFiles,
    setRating,
    readOnlyServiceKeys,
    addFileTags,
  ]);

  // Handle exit animation complete - remove card from exiting list
  const handleExitComplete = useCallback((fileId: number) => {
    setExitingCards((prev) => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  // Perform action based on swipe direction
  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!currentFileId) return;

      const binding = getBindingForDirection(editableBindings, direction);
      // Undo path — reverse last action instead of advancing (no animation, instant swap)
      if (binding.fileAction === "undo") {
        if (history.length === 0) return; // Nothing to undo
        performUndo();
        return;
      }

      // Add to exiting cards to trigger exit animation
      setExitingCards((prev) => new Map(prev).set(currentFileId, direction));

      // Execute primary file action
      const fileState = getFileState();
      executeFileAction(binding.fileAction, currentFileId, fileState, {
        archive: archiveFiles,
        trash: trashFiles,
      });

      if (
        shouldHideFromViewAfterReviewAction(binding.fileAction, {
          hideFilteredFiles,
          hideFilteredFilesEvenWhenSkipped,
        })
      ) {
        hideFileIdsInViewCaches(queryClient, [currentFileId], reviewSources);
      }

      // Execute secondary rating actions and collect restore data
      const ratingsRestore = executeSecondaryRatingActions(
        binding.secondaryActions ?? [],
        currentFileId,
        currentMetadata?.ratings,
        validServiceKeys,
        setRating,
      );

      // Execute secondary tag actions
      let tagsRestore: Array<TagRestoreEntry> = [];
      const tagActions = getTagActions(binding.secondaryActions);
      if (tagActions.length > 0 && canEditTags && resolvedTagServiceKey) {
        const planned = planTagActions(
          tagActions,
          resolvedTagServiceKey,
          currentMetadata?.tags,
        );
        if (planned.tags.length > 0) {
          addFileTags({
            file_ids: [currentFileId],
            service_key: resolvedTagServiceKey,
            tags: planned.tags,
            action: TAG_ACTION_ADD,
          });
          tagsRestore = planned.restore;
        }
      }

      // Record the action in history (always record, even if unchanged)
      const restore: RestoreData = {
        fileState,
        ratings: ratingsRestore.length > 0 ? ratingsRestore : undefined,
        tags: tagsRestore.length > 0 ? tagsRestore : undefined,
      };
      recordAction({
        fileId: currentFileId,
        direction,
        fileAction: binding.fileAction,
        restore,
      });
    },
    [
      currentFileId,
      currentMetadata,
      editableBindings,
      getFileState,
      recordAction,
      archiveFiles,
      trashFiles,
      setRating,
      validServiceKeys,
      queryClient,
      reviewSources,
      hideFilteredFiles,
      hideFilteredFilesEvenWhenSkipped,
      history.length,
      performUndo,
      addFileTags,
      canEditTags,
      resolvedTagServiceKey,
    ],
  );

  const immersiveMode = useReviewImmersiveMode();
  const { setImmersiveMode } = useReviewSettingsActions();
  const toggleImmersive = useCallback(
    () => setImmersiveMode(!immersiveMode),
    [setImmersiveMode, immersiveMode],
  );

  // Favourite ('s') — toggle the favourite rating on the current review file
  const { enabled: favoriteEnabled, toggle: toggleFavorite } =
    useFavoriteToggle(currentFileId ?? 0);
  const handleToggleFavorite = useCallback(() => {
    if (currentFileId == null) return;
    const result = toggleFavorite();
    if (!result) return;
    toast(result.nextLiked ? "★ Favourited" : "Removed favourite", {
      description: result.serviceName,
      duration: 1500,
    });
  }, [currentFileId, toggleFavorite]);

  // Keyboard shortcuts
  const handleInstantSwipe = useCallback(
    (direction: SwipeDirection) => {
      skipAnimationRef.current = true;
      handleSwipe(direction);
    },
    [handleSwipe],
  );
  useReviewKeyboardShortcuts(
    handleInstantSwipe,
    performUndo,
    toggleImmersive,
    currentFileId != null && favoriteEnabled ? handleToggleFavorite : undefined,
  );

  // Gesture swipe from card drag — resets skip flag so animations play
  const handleGestureSwipe = useCallback(
    (direction: SwipeDirection) => {
      skipAnimationRef.current = false;
      handleSwipe(direction);
    },
    [handleSwipe],
  );

  // Get visible cards for the stack (current + next few)
  const visibleFileIds = fileIds.slice(currentIndex, currentIndex + STACK_SIZE);
  const gesturesEnabled = useReviewGesturesEnabled();

  return {
    visibleFileIds,
    exitingCards,
    gesturesEnabled,
    bindings: editableBindings,
    skipAnimationRef,
    canUndo: history.length > 0,
    handleGestureSwipe,
    handleInstantSwipe,
    handleExitComplete,
    performUndo,
    currentMetadata,
  };
}

/** The actual visual deck component */
export function ReviewSwipeDeckVisual({
  visibleFileIds,
  exitingCards,
  gesturesEnabled,
  bindings,
  canUndo,
  skipAnimationRef,
  handleSwipe,
  handleExitComplete,
}: {
  visibleFileIds: Array<number>;
  exitingCards: Map<number, SwipeDirection>;
  gesturesEnabled: boolean;
  bindings: SwipeBindings;
  canUndo: boolean;
  skipAnimationRef: React.RefObject<boolean>;
  handleSwipe: (direction: SwipeDirection) => void;
  handleExitComplete: (fileId: number) => void;
}) {
  // Combine visible cards with exiting cards (exiting cards may not be in visible list anymore)
  const allVisibleFileIds = [...visibleFileIds];
  for (const exitingId of exitingCards.keys()) {
    if (!allVisibleFileIds.includes(exitingId)) {
      // Insert at front since exiting cards were the most recent top card
      allVisibleFileIds.unshift(exitingId);
    }
  }

  return (
    <DeckContainer>
      {(cardSize) => (
        <AnimatePresence>
          {allVisibleFileIds.map((fileId, index) => {
            const exitDirection = exitingCards.get(fileId);
            const isExiting = exitDirection != null;
            // Calculate stack index - exiting cards don't count toward stack position
            const nonExitingIndex = isExiting
              ? 0
              : allVisibleFileIds
                  .slice(0, index)
                  .filter((id) => !exitingCards.has(id)).length;
            // First non-exiting card is the interactive top card
            const isTopCard =
              !isExiting &&
              allVisibleFileIds.findIndex((id) => !exitingCards.has(id)) ===
                index;

            return (
              <ReviewSwipeCard
                key={fileId}
                fileId={fileId}
                isTop={isTopCard}
                stackIndex={nonExitingIndex}
                cardSize={cardSize}
                bindings={bindings}
                canUndo={canUndo}
                exitDirection={exitDirection}
                gesturesEnabled={gesturesEnabled}
                skipAnimationRef={skipAnimationRef}
                onSwipe={handleSwipe}
                onExitComplete={() => handleExitComplete(fileId)}
              >
                <ReviewCardContent fileId={fileId} isTop={isTopCard} />
              </ReviewSwipeCard>
            );
          })}
        </AnimatePresence>
      )}
    </DeckContainer>
  );
}
