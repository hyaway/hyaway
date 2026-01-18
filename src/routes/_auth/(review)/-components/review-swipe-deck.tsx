// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { ReviewSwipeCard } from "./review-swipe-card";
import { ReviewCardContent } from "./review-card-content";
import type { SwipeDirection } from "./review-swipe-card";
import type {
  PreviousFileState,
  ReviewAction,
  ReviewHistoryEntry,
} from "@/stores/review-queue-store";
import {
  useReviewGesturesEnabled,
  useReviewQueueActions,
  useReviewQueueCurrentFileId,
  useReviewQueueCurrentIndex,
  useReviewQueueFileIds,
  useReviewQueueHistory,
  useReviewQueueNextFileIds,
  useReviewShortcutsEnabled,
} from "@/stores/review-queue-store";
import {
  useArchiveFilesMutation,
  useDeleteFilesMutation,
  useGetSingleFileMetadata,
  useUnarchiveFilesMutation,
  useUndeleteFilesMutation,
} from "@/integrations/hydrus-api/queries/manage-files";
import { getFileMetadata } from "@/integrations/hydrus-api/api-client";

/** Number of cards to render in the stack */
const STACK_SIZE = 3;
/** Number of next cards to prefetch metadata for */
const PREFETCH_COUNT = 3;

/** Check if an action didn't change the file state (e.g., archiving already archived) */
function wasActionUnchanged(
  action: ReviewAction,
  previousState: PreviousFileState,
): boolean {
  return (
    (action === "archive" && previousState === "archived") ||
    (action === "trash" && previousState === "trashed")
  );
}

export interface UseReviewSwipeDeckOptions {
  /** Callback when an action is performed */
  onAction?: (action: ReviewAction, fileId: number) => void;
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

  const queryClient = useQueryClient();

  // Mutations
  const archiveMutation = useArchiveFilesMutation();
  const trashMutation = useDeleteFilesMutation();
  const unarchiveMutation = useUnarchiveFilesMutation();
  const undeleteMutation = useUndeleteFilesMutation();

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
  const getPreviousState = useCallback((): PreviousFileState => {
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
      // Only reverse the action if it actually changed the state
      if (!wasActionUnchanged(lastEntry.action, lastEntry.previousState)) {
        if (lastEntry.action === "archive") {
          // Was archived, need to unarchive (put back in inbox)
          unarchiveMutation.mutate({ file_ids: [lastEntry.fileId] });
        } else if (lastEntry.action === "trash") {
          // Was trashed, need to undelete
          undeleteMutation.mutate({ file_ids: [lastEntry.fileId] });
        }
        // Skip doesn't need reversal
      }
    }
  }, [history.length, undo, unarchiveMutation, undeleteMutation]);

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
    (direction: SwipeDirection, action: ReviewAction) => {
      if (!currentFileId) return;

      // Add to exiting cards to trigger exit animation
      setExitingCards((prev) => new Map(prev).set(currentFileId, direction));

      // Get state synchronously before any updates
      const previousState = getPreviousState();
      const isUnchanged = wasActionUnchanged(action, previousState);

      // Only call mutation if the action will actually change the state
      if (!isUnchanged) {
        if (action === "archive") {
          archiveMutation.mutate({ file_ids: [currentFileId] });
        } else if (action === "trash") {
          trashMutation.mutate({ file_ids: [currentFileId] });
        }
        // Skip doesn't need a mutation
      }

      // Record the action in history (always record, even if unchanged)
      const entry: ReviewHistoryEntry = {
        fileId: currentFileId,
        action,
        previousState,
      };
      recordAction(entry);
      onAction?.(action, currentFileId);
    },
    [
      currentFileId,
      getPreviousState,
      recordAction,
      archiveMutation,
      trashMutation,
      onAction,
    ],
  );

  // Keyboard shortcuts
  const shortcutsEnabled = useReviewShortcutsEnabled();
  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focused on input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "h":
        case "H":
          e.preventDefault();
          handleSwipe("left", "trash");
          break;
        case "ArrowRight":
        case "l":
        case "L":
          e.preventDefault();
          handleSwipe("right", "archive");
          break;
        case "ArrowUp":
        case "k":
        case "K":
          e.preventDefault();
          handleSwipe("up", "skip");
          break;
        case "ArrowDown":
        case "z":
        case "Z":
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

  // Handle programmatic actions from footer buttons
  const performAction = useCallback(
    (action: ReviewAction | "undo") => {
      if (action === "undo") {
        performUndo();
      } else {
        const direction: SwipeDirection =
          action === "trash" ? "left" : action === "archive" ? "right" : "up";
        handleSwipe(direction, action);
      }
    },
    [handleSwipe, performUndo],
  );

  return {
    visibleFileIds,
    exitingCards,
    gesturesEnabled,
    handleSwipe,
    handleExitComplete,
    performAction,
    currentMetadata,
  };
}

/** The actual visual deck component */
export function ReviewSwipeDeckVisual({
  visibleFileIds,
  exitingCards,
  gesturesEnabled,
  handleSwipe,
  handleExitComplete,
}: {
  visibleFileIds: Array<number>;
  exitingCards: Map<number, SwipeDirection>;
  gesturesEnabled: boolean;
  handleSwipe: (direction: SwipeDirection, action: ReviewAction) => void;
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
    <div className="relative h-full w-full">
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
    </div>
  );
}
