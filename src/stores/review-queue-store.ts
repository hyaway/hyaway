// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/shallow";
import type {
  RatingSwipeAction,
  SwipeDirection,
} from "@/stores/review-settings-store";

/** Previous state of a file before action, used for undo */
export type PreviousFileState = "inbox" | "archived" | "trashed" | null;

/** Rating type for restoration — derived from the source action type */
export type RatingActionType = RatingSwipeAction["type"];

/** A single rating restoration entry */
export interface RatingRestoreEntry {
  serviceKey: string;
  actionType: RatingActionType;
  previousValue: boolean | number | null;
}

/** Data needed to restore a file to its previous state */
export interface RestoreData {
  /** File state to restore (null means no file action was taken) */
  fileState: PreviousFileState;
  /** Ratings to restore (if any rating actions were taken) */
  ratings?: Array<RatingRestoreEntry>;
}

/** A single action record in the history stack */
export interface ReviewHistoryEntry {
  fileId: number;
  /** The swipe direction that triggered this action */
  direction: SwipeDirection;
  /** Data needed to undo this action */
  restore: RestoreData;
}

/** Stats derived from action history, grouped by swipe direction */
export type ReviewDirectionStats = Record<SwipeDirection, number>;

type ReviewQueueState = {
  /** List of file IDs in the review queue */
  fileIds: Array<number>;
  /** Current index in the queue */
  currentIndex: number;
  /** Action history for undo (not persisted) */
  history: Array<ReviewHistoryEntry>;

  actions: {
    /** Set the queue to a new list of file IDs (replaces existing, dedupes) */
    setQueue: (ids: Array<number>) => void;
    /** Add file IDs to the existing queue (dedupes) */
    addToQueue: (ids: Array<number>) => void;
    /** Clear the entire queue and reset index */
    clearQueue: () => void;
    /** Advance to the next item */
    advance: () => void;
    /** Record an action in history and advance */
    recordAction: (entry: ReviewHistoryEntry) => void;
    /** Undo the last action (decrements index, pops history) */
    undo: () => ReviewHistoryEntry | null;
    /** Clear action history (called on page exit) */
    clearHistory: () => void;
    /** Skip to end - sets currentIndex to end of queue */
    skipToEnd: () => void;
  };
};

const useReviewQueueStore = create<ReviewQueueState>()(
  persist(
    (set, get) => ({
      fileIds: [],
      currentIndex: 0,
      history: [],

      actions: {
        setQueue: (ids) => {
          // Dedupe while preserving order
          const uniqueIds = [...new Set(ids)];
          set({ fileIds: uniqueIds, currentIndex: 0, history: [] });
        },

        addToQueue: (ids) => {
          const { fileIds } = get();
          const existingSet = new Set(fileIds);
          const newIds = ids.filter((id) => !existingSet.has(id));
          if (newIds.length > 0) {
            set({ fileIds: [...fileIds, ...newIds] });
          }
        },

        clearQueue: () => {
          set({ fileIds: [], currentIndex: 0, history: [] });
        },

        advance: () => {
          const { currentIndex, fileIds } = get();
          if (currentIndex < fileIds.length) {
            set({ currentIndex: currentIndex + 1 });
          }
        },

        recordAction: (entry) => {
          const { history, currentIndex, fileIds } = get();
          if (currentIndex < fileIds.length) {
            set({
              history: [...history, entry],
              currentIndex: currentIndex + 1,
            });
          }
        },

        undo: () => {
          const { history, currentIndex } = get();
          if (history.length === 0 || currentIndex === 0) return null;

          const lastEntry = history[history.length - 1];
          set({
            history: history.slice(0, -1),
            currentIndex: currentIndex - 1,
          });
          return lastEntry;
        },

        clearHistory: () => {
          set({ history: [] });
        },

        skipToEnd: () => {
          const { fileIds } = get();
          set({ currentIndex: fileIds.length });
        },
      },
    }),
    {
      name: "hyaway-review-queue-history",
      storage: createJSONStorage(() => sessionStorage),
      // Persist full state - sessionStorage is ephemeral per tab/session
      partialize: (state) => ({
        fileIds: state.fileIds,
        currentIndex: state.currentIndex,
        history: state.history,
      }),
    },
  ),
);

// #region Selectors

/** Get the file IDs in the queue */
export const useReviewQueueFileIds = () =>
  useReviewQueueStore((state) => state.fileIds);

/** Get the current index in the queue */
export const useReviewQueueCurrentIndex = () =>
  useReviewQueueStore((state) => state.currentIndex);

/** Get the action history */
export const useReviewQueueHistory = () =>
  useReviewQueueStore((state) => state.history);

/** Get the current file ID (or undefined if done) */
export const useReviewQueueCurrentFileId = () =>
  useReviewQueueStore((state) => {
    const { fileIds, currentIndex } = state;
    return currentIndex < fileIds.length ? fileIds[currentIndex] : undefined;
  });

/** Get the total count of items in the queue */
export const useReviewQueueCount = () =>
  useReviewQueueStore((state) => state.fileIds.length);

/** Get the remaining count (total - currentIndex) */
export const useReviewQueueRemaining = () =>
  useReviewQueueStore((state) =>
    Math.max(0, state.fileIds.length - state.currentIndex),
  );

/** Check if the queue is complete */
export const useReviewQueueIsComplete = () =>
  useReviewQueueStore(
    (state) =>
      state.fileIds.length > 0 && state.currentIndex >= state.fileIds.length,
  );

/** Check if the queue is empty */
export const useReviewQueueIsEmpty = () =>
  useReviewQueueStore((state) => state.fileIds.length === 0);

/** Derive stats from history, grouped by swipe direction */
export const useReviewDirectionStats = (): ReviewDirectionStats =>
  useReviewQueueStore(
    useShallow((state) => {
      const stats: ReviewDirectionStats = {
        left: 0,
        right: 0,
        up: 0,
        down: 0,
      };
      for (const entry of state.history) {
        stats[entry.direction]++;
      }
      return stats;
    }),
  );

/** Get the next N file IDs for prefetching */
export const useReviewQueueNextFileIds = (count: number) =>
  useReviewQueueStore(
    useShallow((state) => {
      const { fileIds, currentIndex } = state;
      const start = currentIndex + 1;
      const end = Math.min(start + count, fileIds.length);
      return fileIds.slice(start, end);
    }),
  );

/** File IDs grouped by swipe direction (preserves action order) */
export type ReviewFileIdsByDirection = Record<SwipeDirection, Array<number>>;

/** Get actions */
export const useReviewQueueActions = () =>
  useReviewQueueStore((state) => state.actions);

// #endregion
