// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

// #region Types

/** All possible swipe directions */
export const SWIPE_DIRECTIONS = ["up", "down", "left", "right"] as const;

/** Swipe directions that can be bound to actions */
export type SwipeDirection = (typeof SWIPE_DIRECTIONS)[number];

/** File actions that mutate file state (archive, trash, etc.) */
export type ReviewFileMutationAction = "archive" | "trash";

/** All file actions during review — mutation actions + skip (no-op) + undo */
export type ReviewFileAction = ReviewFileMutationAction | "skip" | "undo";

/** How images are loaded in review mode */
export type ReviewImageLoadMode = "original" | "optimized";

/**
 * Rating action to perform on swipe.
 * Represented as a discriminated union to support different rating service types.
 * Currently a placeholder - the UI to configure these will be added later.
 */
export type RatingSwipeAction =
  | {
      /** Set a like/dislike rating */
      type: "setLike";
      serviceKey: string;
      /** true = like, false = dislike, null = clear */
      value: boolean | null;
    }
  | {
      /** Set a numerical star rating */
      type: "setNumerical";
      serviceKey: string;
      /** Star value or null to clear */
      value: number | null;
    }
  | {
      /** Increment or decrement an inc/dec rating */
      type: "incDecDelta";
      serviceKey: string;
      /** +1 to increment, -1 to decrement */
      delta: 1 | -1;
    };

/**
 * Tag action to perform on swipe.
 * Adds a specific tag to the file.
 */
export interface TagSwipeAction {
  /** The tag service key to add the tag to */
  serviceKey: string;
  /** The tag to add (e.g., "character:zelda" or "cute") */
  tag: string;
}

/**
 * Secondary actions that can be performed alongside the primary file action.
 * Supports rating and tag actions, extensible for future action types.
 */
export type SecondarySwipeAction =
  | ({ actionType: "rating" } & RatingSwipeAction)
  | ({ actionType: "addTag" } & TagSwipeAction);

/**
 * A binding that maps a swipe direction to one or more actions.
 * Has a primary file action and optional secondary actions (like rating, tags).
 */
export interface ReviewSwipeBinding {
  /** Primary file management action (archive, trash, skip) - required */
  fileAction: ReviewFileAction;
  /** Secondary actions to perform alongside the file action */
  secondaryActions?: Array<SecondarySwipeAction>;
}

/** Complete mapping of all swipe directions to their bindings */
export type SwipeBindings = Record<SwipeDirection, ReviewSwipeBinding>;

// #endregion

// #region Defaults

/** Default threshold as percentage of card dimension for left/right swipe */
export const DEFAULT_HORIZONTAL_THRESHOLD = 20;
/** Default threshold as percentage of card dimension for up/down swipe */
export const DEFAULT_VERTICAL_THRESHOLD = 15;
/** Minimum threshold percentage for swipe gestures */
export const MIN_SWIPE_THRESHOLD = 0.5;
/** Maximum threshold percentage for swipe gestures (from center, so 45% is near edge) */
export const MAX_SWIPE_THRESHOLD = 45;

/** Complete mapping of all swipe directions to their thresholds */
export type SwipeThresholds = Record<SwipeDirection, number>;

/** Default thresholds per direction */
export const DEFAULT_SWIPE_THRESHOLDS: SwipeThresholds = {
  left: DEFAULT_HORIZONTAL_THRESHOLD,
  right: DEFAULT_HORIZONTAL_THRESHOLD,
  up: DEFAULT_VERTICAL_THRESHOLD,
  down: DEFAULT_VERTICAL_THRESHOLD,
};

/** Default swipe bindings matching current behavior */
export const DEFAULT_SWIPE_BINDINGS: SwipeBindings = {
  left: { fileAction: "trash" },
  right: { fileAction: "archive" },
  up: { fileAction: "skip" },
  down: { fileAction: "undo" },
};

// #endregion

// #region Store

type ReviewSettingsState = {
  /** Enable keyboard shortcuts for review actions */
  shortcutsEnabled: boolean;
  /** Enable swipe gestures for review actions */
  gesturesEnabled: boolean;
  /** Show gesture threshold debug overlay */
  showGestureThresholds: boolean;
  /** Threshold as percentage of card size for each direction */
  thresholds: SwipeThresholds;
  /** Track viewed files in watch history (local + remote sync) */
  trackWatchHistory: boolean;
  /** How to load static images: 'original' for full size, 'resized' for server-side resize */
  imageLoadMode: ReviewImageLoadMode;
  /** Start review in immersive (fullscreen overlay) mode */
  immersiveMode: boolean;
  /** Mapping of swipe directions to action bindings */
  bindings: SwipeBindings;

  actions: {
    /** Enable or disable keyboard shortcuts */
    setShortcutsEnabled: (enabled: boolean) => void;
    /** Enable or disable swipe gestures */
    setGesturesEnabled: (enabled: boolean) => void;
    /** Enable or disable gesture threshold overlay */
    setShowGestureThresholds: (show: boolean) => void;
    /** Set threshold for a specific direction */
    setThreshold: (direction: SwipeDirection, threshold: number) => void;
    /** Enable or disable watch history tracking */
    setTrackWatchHistory: (enabled: boolean) => void;
    /** Set image load mode */
    setImageLoadMode: (mode: ReviewImageLoadMode) => void;
    /** Set immersive mode */
    setImmersiveMode: (enabled: boolean) => void;
    /** Set the binding for a specific direction */
    setBinding: (
      direction: SwipeDirection,
      binding: ReviewSwipeBinding,
    ) => void;
    /** Reset controls settings (shortcuts, gestures) to defaults */
    resetControlsSettings: () => void;
    /** Reset data settings (trackWatchHistory, imageLoadMode, immersiveMode) to defaults */
    resetDataSettings: () => void;
    /** Reset all swipe bindings to defaults */
    resetBindings: () => void;
  };
};

const useReviewSettingsStore = create<ReviewSettingsState>()(
  persist(
    (set, _get, store) => ({
      shortcutsEnabled: true,
      gesturesEnabled: true,
      showGestureThresholds: false,
      thresholds: DEFAULT_SWIPE_THRESHOLDS,
      trackWatchHistory: true,
      imageLoadMode: "optimized",
      immersiveMode: false,
      bindings: DEFAULT_SWIPE_BINDINGS,

      actions: {
        setShortcutsEnabled: (shortcutsEnabled: boolean) => {
          set({ shortcutsEnabled });
        },

        setGesturesEnabled: (gesturesEnabled: boolean) => {
          set({ gesturesEnabled });
        },

        setShowGestureThresholds: (showGestureThresholds: boolean) => {
          set({ showGestureThresholds });
        },

        setThreshold: (direction: SwipeDirection, threshold: number) => {
          const clamped = Math.min(
            MAX_SWIPE_THRESHOLD,
            Math.max(MIN_SWIPE_THRESHOLD, threshold),
          );
          set((state) => ({
            thresholds: {
              ...state.thresholds,
              [direction]: clamped,
            },
          }));
        },

        setTrackWatchHistory: (trackWatchHistory: boolean) => {
          set({ trackWatchHistory });
        },

        setImageLoadMode: (imageLoadMode: ReviewImageLoadMode) => {
          set({ imageLoadMode });
        },

        setImmersiveMode: (immersiveMode: boolean) => {
          set({ immersiveMode });
        },

        setBinding: (direction, binding) => {
          set((state) => ({
            bindings: {
              ...state.bindings,
              [direction]: binding,
            },
          }));
        },

        resetControlsSettings: () => {
          const initial = store.getInitialState();
          set({
            shortcutsEnabled: initial.shortcutsEnabled,
            gesturesEnabled: initial.gesturesEnabled,
            showGestureThresholds: initial.showGestureThresholds,
            thresholds: initial.thresholds,
          });
        },

        resetDataSettings: () => {
          const initial = store.getInitialState();
          set({
            trackWatchHistory: initial.trackWatchHistory,
            imageLoadMode: initial.imageLoadMode,
            immersiveMode: initial.immersiveMode,
          });
        },

        resetBindings: () => {
          const initial = store.getInitialState();
          set({ bindings: initial.bindings });
        },
      },
    }),
    {
      name: "hyaway-review-queue", // Keeping this key for backward compatibility
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        shortcutsEnabled: state.shortcutsEnabled,
        gesturesEnabled: state.gesturesEnabled,
        showGestureThresholds: state.showGestureThresholds,
        thresholds: state.thresholds,
        trackWatchHistory: state.trackWatchHistory,
        imageLoadMode: state.imageLoadMode,
        immersiveMode: state.immersiveMode,
        bindings: state.bindings,
      }),
      // Migrations from older store shapes
      migrate: (persisted, version) => {
        let state = persisted as any;

        // v0 -> v1: horizontalThreshold/verticalThreshold -> thresholds object
        if (version < 1 && state && typeof state === "object") {
          const horizontal =
            typeof state.horizontalThreshold === "number"
              ? state.horizontalThreshold
              : DEFAULT_HORIZONTAL_THRESHOLD;
          const vertical =
            typeof state.verticalThreshold === "number"
              ? state.verticalThreshold
              : DEFAULT_VERTICAL_THRESHOLD;
          state = {
            ...state,
            thresholds: {
              left: horizontal,
              right: horizontal,
              up: vertical,
              down: vertical,
            },
            horizontalThreshold: undefined,
            verticalThreshold: undefined,
          };
        }

        // v1 -> v2: default down binding changed from "skip" to "undo"
        if (version < 2 && state && typeof state === "object") {
          const bindings = state.bindings as SwipeBindings | undefined;
          if (
            bindings?.down &&
            bindings.down.fileAction === "skip" &&
            !bindings.down.secondaryActions?.length
          ) {
            state = {
              ...state,
              bindings: {
                ...bindings,
                down: { fileAction: "undo" },
              },
            };
          }
        }

        // v2 -> v3: thresholds can no longer be 0; clamp persisted values
        if (version < 3 && state && typeof state === "object") {
          const thresholds = state.thresholds as SwipeThresholds | undefined;
          if (thresholds) {
            state = {
              ...state,
              thresholds: {
                left: Math.min(
                  MAX_SWIPE_THRESHOLD,
                  Math.max(
                    MIN_SWIPE_THRESHOLD,
                    thresholds.left || MIN_SWIPE_THRESHOLD,
                  ),
                ),
                right: Math.min(
                  MAX_SWIPE_THRESHOLD,
                  Math.max(
                    MIN_SWIPE_THRESHOLD,
                    thresholds.right || MIN_SWIPE_THRESHOLD,
                  ),
                ),
                up: Math.min(
                  MAX_SWIPE_THRESHOLD,
                  Math.max(
                    MIN_SWIPE_THRESHOLD,
                    thresholds.up || MIN_SWIPE_THRESHOLD,
                  ),
                ),
                down: Math.min(
                  MAX_SWIPE_THRESHOLD,
                  Math.max(
                    MIN_SWIPE_THRESHOLD,
                    thresholds.down || MIN_SWIPE_THRESHOLD,
                  ),
                ),
              },
            };
          }
        }

        return state;
      },
    },
  ),
);

// Sync settings across tabs
setupCrossTabSync(useReviewSettingsStore);

// #endregion

// #region Selectors

/** Get shortcuts enabled setting */
export const useReviewShortcutsEnabled = () =>
  useReviewSettingsStore((state) => state.shortcutsEnabled);

/** Get gestures enabled setting */
export const useReviewGesturesEnabled = () =>
  useReviewSettingsStore((state) => state.gesturesEnabled);

/** Get show gesture thresholds setting */
export const useReviewShowGestureThresholds = () =>
  useReviewSettingsStore((state) => state.showGestureThresholds);

/** Get all thresholds */
export const useReviewSwipeThresholds = () =>
  useReviewSettingsStore((state) => state.thresholds);

/** Get threshold for a specific direction */
export const useReviewThreshold = (direction: SwipeDirection) =>
  useReviewSettingsStore((state) => state.thresholds[direction]);

/** Get track watch history setting */
export const useReviewTrackWatchHistory = () =>
  useReviewSettingsStore((state) => state.trackWatchHistory);

/** Get image load mode setting */
export const useReviewImageLoadMode = () =>
  useReviewSettingsStore((state) => state.imageLoadMode);

/** Get immersive mode setting */
export const useReviewImmersiveMode = () =>
  useReviewSettingsStore((state) => state.immersiveMode);

/** Get the complete bindings object */
export const useReviewSwipeBindings = () =>
  useReviewSettingsStore((state) => state.bindings);

/** Get the binding for a specific direction */
export const useReviewSwipeBinding = (direction: SwipeDirection) =>
  useReviewSettingsStore((state) => state.bindings[direction]);

/** Get actions */
export const useReviewSettingsActions = () =>
  useReviewSettingsStore((state) => state.actions);

/**
 * Get the file action for a direction (if any).
 * Convenience selector for common use case.
 */
export const useFileActionForDirection = (direction: SwipeDirection) =>
  useReviewSettingsStore((state) => state.bindings[direction].fileAction);

// #endregion

// #region Utilities

/**
 * Get the file action for a direction from bindings object.
 * Non-hook version for use in callbacks.
 */
export function getFileActionForDirection(
  bindings: SwipeBindings,
  direction: SwipeDirection,
): ReviewFileAction | undefined {
  return bindings[direction].fileAction;
}

/**
 * Get the binding for a direction from bindings object.
 * Non-hook version for use in callbacks.
 */
export function getBindingForDirection(
  bindings: SwipeBindings,
  direction: SwipeDirection,
): ReviewSwipeBinding {
  return bindings[direction];
}

/**
 * Check if any swipe direction is bound to the undo action.
 */
export function hasUndoBinding(bindings: SwipeBindings): boolean {
  return SWIPE_DIRECTIONS.some((d) => bindings[d].fileAction === "undo");
}

// #endregion
