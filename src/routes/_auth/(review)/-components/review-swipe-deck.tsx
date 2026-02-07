// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { ReviewSwipeCard } from "./review-swipe-card";
import { ReviewCardContent } from "./review-card-content";
import type { SwipeDirection } from "./review-swipe-card";
import type {
  PreviousFileState,
  RatingRestoreEntry,
  RestoreData,
  ReviewHistoryEntry,
} from "@/stores/review-queue-store";
import type {
  ReviewFileAction,
  SwipeBindings,
} from "@/stores/review-settings-store";
import {
  useReviewQueueActions,
  useReviewQueueCurrentFileId,
  useReviewQueueCurrentIndex,
  useReviewQueueFileIds,
  useReviewQueueHistory,
  useReviewQueueNextFileIds,
} from "@/stores/review-queue-store";
import {
  getBindingForDirection,
  useReviewGesturesEnabled,
  useReviewShortcutsEnabled,
  useReviewSwipeBindings,
} from "@/stores/review-settings-store";
import {
  useArchiveFilesMutation,
  useDeleteFilesMutation,
  useGetSingleFileMetadata,
  useUnarchiveFilesMutation,
  useUndeleteFilesMutation,
} from "@/integrations/hydrus-api/queries/manage-files";
import { useSetRatingMutation } from "@/integrations/hydrus-api/queries/ratings";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { getFileMetadata } from "@/integrations/hydrus-api/api-client";
import { shouldIgnoreKeyboardEvent } from "@/lib/keyboard-utils";

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
    <div ref={containerRef} className="relative h-full w-full">
      {children(cardSize)}
    </div>
  );
}

/** Check if a file action didn't change the file state (e.g., archiving already archived) */
function wasFileActionUnchanged(
  action: ReviewFileAction | null | undefined,
  fileState: PreviousFileState,
): boolean {
  return (
    (action === "archive" && fileState === "archived") ||
    (action === "trash" && fileState === "trashed")
  );
}

export interface UseReviewSwipeDeckOptions {
  /** Callback when an action is performed */
  onAction?: (direction: SwipeDirection, fileId: number) => void;
}

export function useReviewSwipeDeck({
  onAction,
}: UseReviewSwipeDeckOptions = {}) {
  const fileIds = useReviewQueueFileIds();
  const currentIndex = useReviewQueueCurrentIndex();
  const currentFileId = useReviewQueueCurrentFileId();
  const history = useReviewQueueHistory();
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

  // Rating services (for filtering orphaned actions)
  const { ratingServices } = useRatingServices();
  const validServiceKeys = new Set(ratingServices.map(([key]) => key));

  // Current file metadata
  const { data: currentMetadata } = useGetSingleFileMetadata(
    currentFileId ?? 0,
  );

  // Exit animation state - track exiting cards to keep them rendered
  const [exitingCards, setExitingCards] = useState<Map<number, SwipeDirection>>(
    new Map(),
  );

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
      const { restore } = lastEntry;
      const binding = getBindingForDirection(bindings, lastEntry.direction);
      const fileAction = binding.fileAction;

      // Reverse file action if it actually changed the state
      if (!wasFileActionUnchanged(fileAction, restore.fileState)) {
        if (fileAction === "archive") {
          // Was archived, need to unarchive (put back in inbox)
          unarchiveFiles({ file_ids: [lastEntry.fileId] });
        } else if (fileAction === "trash") {
          // Was trashed, need to undelete
          undeleteFiles({ file_ids: [lastEntry.fileId] });
        }
        // Skip doesn't need reversal
      }

      // Reverse rating action if present
      if (restore.ratings && restore.ratings.length > 0) {
        for (const rating of restore.ratings) {
          setRating({
            file_id: lastEntry.fileId,
            rating_service_key: rating.serviceKey,
            rating: rating.previousValue,
          });
        }
      }
    }
  }, [
    history.length,
    undo,
    bindings,
    unarchiveFiles,
    undeleteFiles,
    setRating,
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

      // Get the binding for this direction
      const binding = getBindingForDirection(bindings, direction);

      // Add to exiting cards to trigger exit animation
      setExitingCards((prev) => new Map(prev).set(currentFileId, direction));

      // Capture current state for restoration
      const fileState = getFileState();
      const fileAction = binding.fileAction;
      const isUnchanged = wasFileActionUnchanged(fileAction, fileState);

      // Execute file action mutation if it will change state
      if (!isUnchanged) {
        if (fileAction === "archive") {
          archiveFiles({ file_ids: [currentFileId] });
        } else if (fileAction === "trash") {
          trashFiles({ file_ids: [currentFileId] });
        }
        // Skip doesn't need a mutation
      }

      // Execute secondary actions (rating actions, etc.)
      const ratingsRestore: Array<RatingRestoreEntry> = [];
      const secondaryActions = binding.secondaryActions ?? [];

      for (const action of secondaryActions) {
        if (action.actionType === "rating") {
          const serviceKey = action.serviceKey;

          // Skip orphaned rating actions (service no longer exists)
          if (!validServiceKeys.has(serviceKey)) {
            continue;
          }

          const currentRating = currentMetadata?.ratings?.[serviceKey] ?? null;

          if (action.type === "setLike") {
            // Store previous value for undo
            ratingsRestore.push({
              serviceKey,
              actionType: "setLike",
              previousValue: currentRating as boolean | null,
            });
            // Set the new value
            setRating({
              file_id: currentFileId,
              rating_service_key: serviceKey,
              rating: action.value,
            });
          } else if (action.type === "setNumerical") {
            // Store previous value for undo
            ratingsRestore.push({
              serviceKey,
              actionType: "setNumerical",
              previousValue: currentRating as number | null,
            });
            // Set the new value
            setRating({
              file_id: currentFileId,
              rating_service_key: serviceKey,
              rating: action.value,
            });
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          } else if (action.type === "incDecDelta") {
            // Store previous value for undo
            const prevValue = (currentRating as number | null) ?? 0;
            ratingsRestore.push({
              serviceKey,
              actionType: "incDecDelta",
              previousValue: prevValue,
            });
            // Apply delta
            const newValue = Math.max(0, prevValue + action.delta);
            setRating({
              file_id: currentFileId,
              rating_service_key: serviceKey,
              rating: newValue,
            });
          }
        }
      }

      // Build restore data for undo
      const restore: RestoreData = {
        fileState,
        ratings: ratingsRestore.length > 0 ? ratingsRestore : undefined,
      };

      // Record the action in history (always record, even if unchanged)
      const entry: ReviewHistoryEntry = {
        fileId: currentFileId,
        direction,
        restore,
      };
      recordAction(entry);
      onAction?.(direction, currentFileId);
    },
    [
      currentFileId,
      currentMetadata,
      bindings,
      getFileState,
      recordAction,
      archiveFiles,
      trashFiles,
      setRating,
      onAction,
    ],
  );

  // Keyboard shortcuts
  const shortcutsEnabled = useReviewShortcutsEnabled();
  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeyboardEvent(e, { checkOverlays: true })) return;

      switch (e.key) {
        case "ArrowLeft":
        case "h":
        case "H":
          e.preventDefault();
          handleSwipe("left");
          break;
        case "ArrowRight":
        case "l":
        case "L":
          e.preventDefault();
          handleSwipe("right");
          break;
        case "ArrowUp":
        case "k":
        case "K":
          e.preventDefault();
          handleSwipe("up");
          break;
        case "ArrowDown":
        case "j":
        case "J":
          e.preventDefault();
          handleSwipe("down");
          break;
        case "z":
        case "Z":
        case "Backspace":
          e.preventDefault();
          performUndo();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutsEnabled, handleSwipe, performUndo]);

  // Get visible cards for the stack (current + next few)
  const visibleFileIds = fileIds.slice(currentIndex, currentIndex + STACK_SIZE);
  const gesturesEnabled = useReviewGesturesEnabled();

  return {
    visibleFileIds,
    exitingCards,
    gesturesEnabled,
    bindings,
    handleSwipe,
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
  handleSwipe,
  handleExitComplete,
}: {
  visibleFileIds: Array<number>;
  exitingCards: Map<number, SwipeDirection>;
  gesturesEnabled: boolean;
  bindings: SwipeBindings;
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
                exitDirection={exitDirection}
                gesturesEnabled={gesturesEnabled}
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
