// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { generateID } from "@react-querybuilder/core";
import type {
  LocalTagServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import {
  isIncDecRatingService,
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";
import {
  MAX_OPTIMIZE_SIZE_THRESHOLD_MB,
  MIN_OPTIMIZE_SIZE_THRESHOLD_MB,
  normalizeOptimizeSizeThresholdMB,
} from "@/lib/optimize-image-settings";

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

type EmptyRatingSwipeAction = {
  type?: undefined;
  serviceKey?: string;
};

type LooseSetLikeRatingSwipeAction = {
  /** Set a like/dislike rating */
  type: "setLike";
  serviceKey?: string;
  /** true = like, false = dislike, null = clear */
  value?: boolean | null;
};

type LooseSetNumericalRatingSwipeAction = {
  /** Set a numerical star rating */
  type: "setNumerical";
  serviceKey?: string;
  /** Star value or null to clear */
  value?: number | null;
};

type LooseIncDecDeltaRatingSwipeAction = {
  /** Increment or decrement an inc/dec rating */
  type: "incDecDelta";
  serviceKey?: string;
  /** +1 to increment, -1 to decrement */
  delta?: 1 | -1;
};

type LooseSelectedRatingSwipeAction =
  | LooseSetLikeRatingSwipeAction
  | LooseSetNumericalRatingSwipeAction
  | LooseIncDecDeltaRatingSwipeAction;

/**
 * Rating action to perform on swipe.
 * Represented as a discriminated union to support different rating service types.
 */
export type LooseRatingSwipeAction =
  | EmptyRatingSwipeAction
  | LooseSelectedRatingSwipeAction;

export type ValidRatingSwipeAction =
  | Required<LooseSetLikeRatingSwipeAction>
  | Required<LooseSetNumericalRatingSwipeAction>
  | Required<LooseIncDecDeltaRatingSwipeAction>;

/**
 * Tag action to perform on swipe.
 * Adds or removes a specific storage tag mapping from the file.
 */
export type TagSwipeActionType = "add" | "remove";

type EmptyTagSwipeAction = {
  type?: undefined;
  serviceKey?: string;
  tag?: string;
};

type LooseSelectedTagSwipeAction = {
  type: TagSwipeActionType;
  serviceKey?: string;
  tag?: string;
};

export type LooseTagSwipeAction =
  | EmptyTagSwipeAction
  | LooseSelectedTagSwipeAction;

export type ValidTagSwipeAction = Required<LooseSelectedTagSwipeAction>;

/**
 * Secondary actions that can be performed alongside the primary file action.
 * Supports rating and tag actions, extensible for future action types.
 */
export type LooseRatingSecondarySwipeAction = {
  id: string;
  actionType: "rating";
} & LooseRatingSwipeAction;

export type ValidRatingSecondarySwipeAction = {
  id: string;
  actionType: "rating";
} & ValidRatingSwipeAction;

export type LooseTagSecondarySwipeAction = {
  id: string;
  actionType: "tag";
} & LooseTagSwipeAction;

export type ValidTagSecondarySwipeAction = {
  id: string;
  actionType: "tag";
} & ValidTagSwipeAction;

export type LooseSecondarySwipeAction =
  | LooseRatingSecondarySwipeAction
  | LooseTagSecondarySwipeAction;

export type ValidSecondarySwipeAction =
  | ValidRatingSecondarySwipeAction
  | ValidTagSecondarySwipeAction;

export type LooseSecondarySwipeActionType =
  LooseSecondarySwipeAction["actionType"];

export type LooseSecondarySwipeActionOf<
  TActionType extends LooseSecondarySwipeActionType,
> = Extract<LooseSecondarySwipeAction, { actionType: TActionType }>;

type UnnormalizedLooseSecondarySwipeAction =
  | (Omit<LooseRatingSecondarySwipeAction, "id"> & { id?: string })
  | (Omit<LooseTagSecondarySwipeAction, "id"> & { id?: string });

/**
 * A binding that maps a swipe direction to one or more actions.
 * Has a primary file action and optional secondary actions (like rating, tags).
 */
export interface ReviewSwipeBinding {
  /** Primary file management action (archive, trash, skip) - required */
  fileAction: ReviewFileAction;
  /** Secondary actions to perform alongside the file action */
  secondaryActions?: Array<LooseSecondarySwipeAction>;
}

export type ValidReviewSwipeBinding = Omit<
  ReviewSwipeBinding,
  "secondaryActions"
> & {
  secondaryActions?: Array<ValidSecondarySwipeAction>;
};

/** Complete mapping of all swipe directions to their bindings */
export type SwipeBindings = Record<SwipeDirection, ReviewSwipeBinding>;
export type ValidSwipeBindings = Record<
  SwipeDirection,
  ValidReviewSwipeBinding
>;

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

export const DEFAULT_REVIEW_RENDER_QUALITY = 90;
export const MIN_REVIEW_RENDER_QUALITY = 40;
export const MAX_REVIEW_RENDER_QUALITY = 100;
export const DEFAULT_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB = 3;
export const MIN_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB =
  MIN_OPTIMIZE_SIZE_THRESHOLD_MB;
export const MAX_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB =
  MAX_OPTIMIZE_SIZE_THRESHOLD_MB;

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
  /** WEBP quality used when review mode renders optimized images */
  renderQuality: number;
  /** Minimum file size in MB before review mode offers optimized rendering */
  optimizeSizeThresholdMB: number;
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
    /** Set optimized render quality */
    setRenderQuality: (quality: number) => void;
    /** Set minimum file size before optimized rendering is used */
    setOptimizeSizeThresholdMB: (sizeMB: number) => void;
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
      renderQuality: DEFAULT_REVIEW_RENDER_QUALITY,
      optimizeSizeThresholdMB: DEFAULT_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB,
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

        setRenderQuality: (renderQuality: number) => {
          set({
            renderQuality: Math.min(
              MAX_REVIEW_RENDER_QUALITY,
              Math.max(MIN_REVIEW_RENDER_QUALITY, renderQuality),
            ),
          });
        },

        setOptimizeSizeThresholdMB: (optimizeSizeThresholdMB: number) => {
          set({
            optimizeSizeThresholdMB: normalizeOptimizeSizeThresholdMB(
              optimizeSizeThresholdMB,
            ),
          });
        },

        setImmersiveMode: (immersiveMode: boolean) => {
          set({ immersiveMode });
        },

        setBinding: (direction, binding) => {
          set((state) => ({
            bindings: {
              ...state.bindings,
              [direction]: normalizeReviewSwipeBinding(binding),
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
            renderQuality: initial.renderQuality,
            optimizeSizeThresholdMB: initial.optimizeSizeThresholdMB,
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
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        shortcutsEnabled: state.shortcutsEnabled,
        gesturesEnabled: state.gesturesEnabled,
        showGestureThresholds: state.showGestureThresholds,
        thresholds: state.thresholds,
        trackWatchHistory: state.trackWatchHistory,
        imageLoadMode: state.imageLoadMode,
        renderQuality: state.renderQuality,
        optimizeSizeThresholdMB: state.optimizeSizeThresholdMB,
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

        // v3 -> v4: normalize duplicate secondary swipe actions and add row ids.
        if (version < 4 && state && typeof state === "object") {
          const bindings = state.bindings as SwipeBindings | undefined;
          if (bindings) {
            state = {
              ...state,
              bindings: normalizeSwipeBindings(bindings),
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

/** Get optimized render quality setting */
export const useReviewRenderQuality = () =>
  useReviewSettingsStore((state) => state.renderQuality);

/** Get minimum file size before optimized rendering is used */
export const useReviewOptimizeSizeThresholdMB = () =>
  useReviewSettingsStore((state) => state.optimizeSizeThresholdMB);

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
export function getBindingForDirection<TBinding extends ReviewSwipeBinding>(
  bindings: Record<SwipeDirection, TBinding>,
  direction: SwipeDirection,
): TBinding {
  return bindings[direction];
}

/**
 * Check if any swipe direction is bound to the undo action.
 */
export function hasUndoBinding(bindings: SwipeBindings): boolean {
  return SWIPE_DIRECTIONS.some((d) => bindings[d].fileAction === "undo");
}

export function createSecondarySwipeActionId(
  actionType: LooseSecondarySwipeAction["actionType"],
): string {
  return `${actionType}:${generateID()}`;
}

function withNormalizedSecondaryActionId(
  action: UnnormalizedLooseSecondarySwipeAction,
  usedIds: Set<string>,
): LooseSecondarySwipeAction {
  if (action.id && !usedIds.has(action.id)) {
    usedIds.add(action.id);
    return { ...action, id: action.id };
  }

  let id = createSecondarySwipeActionId(action.actionType);
  while (usedIds.has(id)) {
    id = createSecondarySwipeActionId(action.actionType);
  }

  usedIds.add(id);
  return { ...action, id };
}

function normalizeSecondaryActions(
  secondaryActions: Array<UnnormalizedLooseSecondarySwipeAction> | undefined,
): Array<LooseSecondarySwipeAction> | undefined {
  if (!secondaryActions?.length) return undefined;

  const actionIds = new Set<string>();
  const normalized = secondaryActions.map((action) =>
    withNormalizedSecondaryActionId(action, actionIds),
  );

  return normalized.length > 0 ? normalized : undefined;
}

export interface SecondarySwipeActionValidityContext {
  ratingServicesByKey?: Map<string, RatingServiceInfo>;
  localTagServicesByKey?: Map<string, LocalTagServiceInfo>;
  readOnlyRatingServiceKeys?: Set<string>;
  canEditFileRatings?: boolean;
  canEditFileTags?: boolean;
}

export function getAllSecondarySwipeActions(
  binding: ReviewSwipeBinding,
): Array<LooseSecondarySwipeAction> {
  return binding.secondaryActions ?? [];
}

export function getSecondarySwipeActionsByType<
  TActionType extends LooseSecondarySwipeActionType,
>(
  secondaryActions: Array<LooseSecondarySwipeAction> | undefined,
  actionType: TActionType,
): Array<LooseSecondarySwipeActionOf<TActionType>> {
  return (
    secondaryActions?.filter(
      (action): action is LooseSecondarySwipeActionOf<TActionType> =>
        action.actionType === actionType,
    ) ?? []
  );
}

export function withUpsertedSecondarySwipeAction(
  secondaryActions: Array<LooseSecondarySwipeAction> | undefined,
  replacement: LooseSecondarySwipeAction,
): Array<LooseSecondarySwipeAction> {
  const actions = secondaryActions ?? [];
  const replacementIndex = actions.findIndex(
    (action) =>
      action.actionType === replacement.actionType &&
      action.id === replacement.id,
  );

  if (replacementIndex === -1) {
    return [...actions, replacement];
  }

  return actions.map((action, index) =>
    index === replacementIndex ? replacement : action,
  );
}

export function withoutSecondarySwipeAction(
  secondaryActions: Array<LooseSecondarySwipeAction> | undefined,
  actionType: LooseSecondarySwipeActionType,
  actionId: string,
): Array<LooseSecondarySwipeAction> | undefined {
  const otherActions = (secondaryActions ?? []).filter(
    (action) => action.actionType !== actionType || action.id !== actionId,
  );
  return otherActions.length > 0 ? otherActions : undefined;
}

export function getTagSwipeActionIdentity(
  action: Pick<LooseTagSwipeAction, "serviceKey" | "tag">,
) {
  return `${action.serviceKey}\u0000${action.tag}`;
}

export function isValidRatingSecondarySwipeAction(
  action: LooseSecondarySwipeAction,
  context: SecondarySwipeActionValidityContext = {},
): action is ValidRatingSecondarySwipeAction {
  if (action.actionType !== "rating") return false;
  if (!action.id) return false;
  if (context.canEditFileRatings === false) return false;
  if (!action.serviceKey) return false;
  if (context.readOnlyRatingServiceKeys?.has(action.serviceKey)) return false;

  const service = context.ratingServicesByKey?.get(action.serviceKey);
  if (context.ratingServicesByKey && !service) return false;

  switch (action.type) {
    case undefined:
      return false;
    case "setLike":
      if (service && !isLikeRatingService(service)) return false;
      return action.value !== undefined;
    case "setNumerical":
      if (service && !isNumericalRatingService(service)) return false;
      return action.value !== undefined;
    case "incDecDelta":
      if (service && !isIncDecRatingService(service)) return false;
      return action.delta === 1 || action.delta === -1;
  }
}

export function isValidTagSecondarySwipeAction(
  action: LooseSecondarySwipeAction,
  context: SecondarySwipeActionValidityContext = {},
): action is ValidTagSecondarySwipeAction {
  if (action.actionType !== "tag") return false;
  if (!action.id) return false;
  if (context.canEditFileTags === false) return false;
  if (!action.type || !action.serviceKey || !action.tag?.trim()) return false;
  if (
    context.localTagServicesByKey &&
    !context.localTagServicesByKey.has(action.serviceKey)
  ) {
    return false;
  }

  return true;
}

export function isValidSecondarySwipeAction(
  action: LooseSecondarySwipeAction,
  context: SecondarySwipeActionValidityContext = {},
): action is ValidSecondarySwipeAction {
  return (
    isValidRatingSecondarySwipeAction(action, context) ||
    isValidTagSecondarySwipeAction(action, context)
  );
}

export function getValidSecondarySwipeActions(
  binding: ReviewSwipeBinding,
  context: SecondarySwipeActionValidityContext = {},
): Array<ValidSecondarySwipeAction> {
  return getAllSecondarySwipeActions(binding).filter((action) =>
    isValidSecondarySwipeAction(action, context),
  );
}

export function getValidReviewSwipeBinding(
  binding: ReviewSwipeBinding,
  context: SecondarySwipeActionValidityContext = {},
): ValidReviewSwipeBinding {
  const secondaryActions = getValidSecondarySwipeActions(binding, context);

  if (secondaryActions.length === (binding.secondaryActions?.length ?? 0)) {
    return binding as ValidReviewSwipeBinding;
  }

  return {
    ...binding,
    secondaryActions:
      secondaryActions.length > 0 ? secondaryActions : undefined,
  };
}

export function getValidSwipeBindings(
  bindings: SwipeBindings,
  context: SecondarySwipeActionValidityContext = {},
): ValidSwipeBindings {
  let changed = false;
  const nextBindings = { ...bindings } as ValidSwipeBindings;

  for (const direction of SWIPE_DIRECTIONS) {
    const nextBinding = getValidReviewSwipeBinding(
      bindings[direction],
      context,
    );
    if (nextBinding !== bindings[direction]) {
      nextBindings[direction] = nextBinding;
      changed = true;
    }
  }

  return changed ? nextBindings : (bindings as ValidSwipeBindings);
}

export function normalizeReviewSwipeBinding(
  binding: ReviewSwipeBinding,
): ReviewSwipeBinding {
  if (binding.fileAction === "undo") {
    return binding.secondaryActions?.length
      ? { ...binding, secondaryActions: undefined }
      : binding;
  }

  const secondaryActions = normalizeSecondaryActions(binding.secondaryActions);
  if (secondaryActions === binding.secondaryActions) {
    return binding;
  }

  return {
    ...binding,
    secondaryActions,
  };
}

export function normalizeSwipeBindings(bindings: SwipeBindings): SwipeBindings {
  let changed = false;
  const nextBindings = { ...bindings };

  for (const direction of SWIPE_DIRECTIONS) {
    const nextBinding = normalizeReviewSwipeBinding(bindings[direction]);
    if (nextBinding !== bindings[direction]) {
      nextBindings[direction] = nextBinding;
      changed = true;
    }
  }

  return changed ? nextBindings : bindings;
}

function stripSecondaryActions(
  binding: ReviewSwipeBinding,
  shouldStrip: (action: LooseSecondarySwipeAction) => boolean,
): ReviewSwipeBinding {
  if (!binding.secondaryActions?.length) return binding;

  const secondaryActions = binding.secondaryActions.filter(
    (action) => !shouldStrip(action),
  );

  if (secondaryActions.length === binding.secondaryActions.length) {
    return binding;
  }

  return {
    ...binding,
    secondaryActions:
      secondaryActions.length > 0 ? secondaryActions : undefined,
  };
}

function stripSecondaryActionsFromBindings(
  bindings: SwipeBindings,
  shouldStrip: (action: LooseSecondarySwipeAction) => boolean,
): SwipeBindings {
  let changed = false;
  const nextBindings = { ...bindings };

  for (const direction of SWIPE_DIRECTIONS) {
    const nextBinding = stripSecondaryActions(bindings[direction], shouldStrip);
    if (nextBinding !== bindings[direction]) {
      nextBindings[direction] = nextBinding;
      changed = true;
    }
  }

  return changed ? nextBindings : bindings;
}

/** Remove rating secondary actions that target any of the given service keys. */
export function stripRatingActionsForServices(
  binding: ReviewSwipeBinding,
  serviceKeys: Set<string>,
): ReviewSwipeBinding {
  if (serviceKeys.size === 0 || !binding.secondaryActions?.length) {
    return binding;
  }

  return stripSecondaryActions(
    binding,
    (action) =>
      action.actionType === "rating" &&
      !!action.serviceKey &&
      serviceKeys.has(action.serviceKey),
  );
}

/** Remove rating secondary actions for every binding in a bindings map. */
export function stripRatingActionsForServicesFromBindings(
  bindings: SwipeBindings,
  serviceKeys: Set<string>,
): SwipeBindings {
  if (serviceKeys.size === 0) return bindings;

  return stripSecondaryActionsFromBindings(
    bindings,
    (action) =>
      action.actionType === "rating" &&
      !!action.serviceKey &&
      serviceKeys.has(action.serviceKey),
  );
}

function shouldStripRatingAction(
  action: LooseRatingSwipeAction,
  ratingServicesByKey: Map<string, RatingServiceInfo> | undefined,
) {
  return !action.serviceKey || !ratingServicesByKey?.has(action.serviceKey);
}

export function stripInvalidRatingActions(
  binding: ReviewSwipeBinding,
  ratingServicesByKey: Map<string, RatingServiceInfo> | undefined,
): ReviewSwipeBinding {
  return stripSecondaryActions(
    binding,
    (action) =>
      action.actionType === "rating" &&
      shouldStripRatingAction(action, ratingServicesByKey),
  );
}

export function stripInvalidRatingActionsFromBindings(
  bindings: SwipeBindings,
  ratingServicesByKey: Map<string, RatingServiceInfo> | undefined,
): SwipeBindings {
  return stripSecondaryActionsFromBindings(
    bindings,
    (action) =>
      action.actionType === "rating" &&
      shouldStripRatingAction(action, ratingServicesByKey),
  );
}

export function stripRatingActionsForMissingPermission(
  bindings: SwipeBindings,
  canEditFileRatings: boolean,
): SwipeBindings {
  if (canEditFileRatings) return bindings;

  return stripSecondaryActionsFromBindings(
    bindings,
    (action) => action.actionType === "rating",
  );
}

function shouldStripTagAction(
  action: LooseTagSwipeAction,
  localTagServicesByKey: Map<string, LocalTagServiceInfo> | undefined,
) {
  return !action.serviceKey || !localTagServicesByKey?.has(action.serviceKey);
}

export function stripInvalidTagActions(
  binding: ReviewSwipeBinding,
  localTagServicesByKey: Map<string, LocalTagServiceInfo> | undefined,
): ReviewSwipeBinding {
  return stripSecondaryActions(
    binding,
    (action) =>
      action.actionType === "tag" &&
      shouldStripTagAction(action, localTagServicesByKey),
  );
}

export function stripInvalidTagActionsFromBindings(
  bindings: SwipeBindings,
  localTagServicesByKey: Map<string, LocalTagServiceInfo> | undefined,
): SwipeBindings {
  return stripSecondaryActionsFromBindings(
    bindings,
    (action) =>
      action.actionType === "tag" &&
      shouldStripTagAction(action, localTagServicesByKey),
  );
}

export function stripTagActionsForMissingPermission(
  bindings: SwipeBindings,
  canEditFileTags: boolean,
): SwipeBindings {
  if (canEditFileTags) return bindings;

  return stripSecondaryActionsFromBindings(
    bindings,
    (action) => action.actionType === "tag",
  );
}

// #endregion
