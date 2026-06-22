// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/shallow";
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

export interface ReviewBindingProfile {
  id: string;
  name: string;
  bindings: SwipeBindings;
}

export type ReviewBindingProfiles = Record<string, ReviewBindingProfile>;

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

export const DEFAULT_BINDING_PROFILE_ID = "default";
export const DEFAULT_BINDING_PROFILE_NAME = "Default";

export const DEFAULT_REVIEW_RENDER_QUALITY = 90;
export const MIN_REVIEW_RENDER_QUALITY = 40;
export const MAX_REVIEW_RENDER_QUALITY = 100;
export const DEFAULT_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB = 3;
export const MIN_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB =
  MIN_OPTIMIZE_SIZE_THRESHOLD_MB;
export const MAX_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB =
  MAX_OPTIMIZE_SIZE_THRESHOLD_MB;

// #endregion

// #region Binding Profile Utilities

function cloneReviewSwipeBinding(
  binding: ReviewSwipeBinding,
): ReviewSwipeBinding {
  return {
    ...binding,
    secondaryActions: binding.secondaryActions?.map((action) => ({
      ...action,
    })),
  };
}

export function cloneSwipeBindings(bindings: SwipeBindings): SwipeBindings {
  return {
    left: cloneReviewSwipeBinding(bindings.left),
    right: cloneReviewSwipeBinding(bindings.right),
    up: cloneReviewSwipeBinding(bindings.up),
    down: cloneReviewSwipeBinding(bindings.down),
  };
}

function createDefaultBindingProfiles(
  bindings: SwipeBindings = DEFAULT_SWIPE_BINDINGS,
): ReviewBindingProfiles {
  return {
    [DEFAULT_BINDING_PROFILE_ID]: {
      id: DEFAULT_BINDING_PROFILE_ID,
      name: DEFAULT_BINDING_PROFILE_NAME,
      bindings: normalizeSwipeBindings(cloneSwipeBindings(bindings)),
    },
  };
}

function normalizeBindingProfileName(name: string) {
  return name.trim() || DEFAULT_BINDING_PROFILE_NAME;
}

function getUniqueBindingProfileName(
  profiles: ReviewBindingProfiles,
  name: string,
  allowedProfileId?: string,
) {
  const baseName = normalizeBindingProfileName(name);
  const usedNames = new Set(
    Object.values(profiles)
      .filter((profile) => profile.id !== allowedProfileId)
      .map((profile) => profile.name.toLocaleLowerCase()),
  );

  if (!usedNames.has(baseName.toLocaleLowerCase())) return baseName;

  const match = baseName.match(/^(.*?)\s*\((\d+)\)$/);
  const nameRoot = match ? match[1].trim() : baseName;
  let index = match ? Number(match[2]) + 1 : 2;
  let candidate = `${nameRoot} (${index})`;

  while (usedNames.has(candidate.toLocaleLowerCase())) {
    index++;
    candidate = `${nameRoot} (${index})`;
  }

  return candidate;
}

function getAvailableBindingProfileId(profiles: ReviewBindingProfiles) {
  let profileId = `profile-${generateID()}`;
  while (Object.hasOwn(profiles, profileId)) {
    profileId = `profile-${generateID()}`;
  }
  return profileId;
}

function getBindingProfile(profiles: ReviewBindingProfiles, profileId: string) {
  return (profiles as Partial<ReviewBindingProfiles>)[profileId];
}

function createBindingProfile(
  profiles: ReviewBindingProfiles,
  name: string,
  bindings: SwipeBindings,
): ReviewBindingProfile {
  const id = getAvailableBindingProfileId(profiles);
  return {
    id,
    name: getUniqueBindingProfileName(profiles, name),
    bindings: normalizeSwipeBindings(cloneSwipeBindings(bindings)),
  };
}

export function getSortedBindingProfiles(
  profiles: ReviewBindingProfiles,
): Array<ReviewBindingProfile> {
  return Object.values(profiles).sort((left, right) =>
    left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
      numeric: true,
    }),
  );
}

function getActiveBindingProfile(
  state: Pick<
    ReviewSettingsState,
    "activeBindingProfileId" | "bindingProfiles"
  >,
) {
  const activeProfile = getBindingProfile(
    state.bindingProfiles,
    state.activeBindingProfileId,
  );
  return (
    activeProfile ??
    getSortedBindingProfiles(state.bindingProfiles).at(0) ??
    createDefaultBindingProfiles()[DEFAULT_BINDING_PROFILE_ID]
  );
}

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
  /** Active swipe binding profile ID */
  activeBindingProfileId: string;
  /** Saved swipe binding profiles */
  bindingProfiles: ReviewBindingProfiles;

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
    /** Set the active swipe binding profile */
    setActiveBindingProfile: (profileId: string) => void;
    /** Create a fresh binding profile and return its ID */
    createBindingProfile: (name?: string) => string;
    /** Clone the active binding profile and return the clone ID */
    cloneActiveBindingProfile: () => string;
    /** Delete a binding profile, recreating Default if the last profile is deleted */
    deleteBindingProfile: (profileId: string) => void;
    /** Rename a binding profile and return the final display name */
    renameBindingProfile: (profileId: string, name: string) => string;
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
    (set, get, store) => ({
      shortcutsEnabled: true,
      gesturesEnabled: true,
      showGestureThresholds: false,
      thresholds: DEFAULT_SWIPE_THRESHOLDS,
      trackWatchHistory: true,
      imageLoadMode: "optimized",
      renderQuality: DEFAULT_REVIEW_RENDER_QUALITY,
      optimizeSizeThresholdMB: DEFAULT_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB,
      immersiveMode: false,
      activeBindingProfileId: DEFAULT_BINDING_PROFILE_ID,
      bindingProfiles: createDefaultBindingProfiles(),

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

        setActiveBindingProfile: (activeBindingProfileId) => {
          set((state) =>
            getBindingProfile(state.bindingProfiles, activeBindingProfileId)
              ? { activeBindingProfileId }
              : {},
          );
        },

        createBindingProfile: (name = DEFAULT_BINDING_PROFILE_NAME) => {
          const current = get();
          const profile = createBindingProfile(
            current.bindingProfiles,
            name,
            DEFAULT_SWIPE_BINDINGS,
          );
          set((state) => ({
            activeBindingProfileId: profile.id,
            bindingProfiles: {
              ...state.bindingProfiles,
              [profile.id]: profile,
            },
          }));
          return profile.id;
        },

        cloneActiveBindingProfile: () => {
          const current = get();
          const source = getActiveBindingProfile(current);
          const profile = createBindingProfile(
            current.bindingProfiles,
            source.name,
            source.bindings,
          );
          set((state) => ({
            activeBindingProfileId: profile.id,
            bindingProfiles: {
              ...state.bindingProfiles,
              [profile.id]: profile,
            },
          }));
          return profile.id;
        },

        deleteBindingProfile: (profileId) => {
          set((state) => {
            const { [profileId]: _removed, ...remainingProfiles } =
              state.bindingProfiles;

            if (Object.keys(remainingProfiles).length === 0) {
              return {
                activeBindingProfileId: DEFAULT_BINDING_PROFILE_ID,
                bindingProfiles: createDefaultBindingProfiles(),
              };
            }

            const activeBindingProfileId =
              state.activeBindingProfileId === profileId
                ? getSortedBindingProfiles(remainingProfiles)[0].id
                : state.activeBindingProfileId;

            return {
              activeBindingProfileId,
              bindingProfiles: remainingProfiles,
            };
          });
        },

        renameBindingProfile: (profileId, name) => {
          const current = get();
          const profile = getBindingProfile(current.bindingProfiles, profileId);
          if (!profile) return name.trim();

          const nextName = getUniqueBindingProfileName(
            current.bindingProfiles,
            name,
            profileId,
          );
          if (nextName === profile.name) return nextName;

          set((state) => ({
            bindingProfiles: {
              ...state.bindingProfiles,
              [profileId]: {
                ...profile,
                name: nextName,
              },
            },
          }));
          return nextName;
        },

        setBinding: (
          direction: SwipeDirection,
          binding: ReviewSwipeBinding,
        ) => {
          set((state) => ({
            bindingProfiles: {
              ...state.bindingProfiles,
              [state.activeBindingProfileId]: {
                ...getActiveBindingProfile(state),
                bindings: {
                  ...getActiveBindingProfile(state).bindings,
                  [direction]: normalizeReviewSwipeBinding(binding),
                },
              },
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
          set((state) => ({
            bindingProfiles: {
              ...state.bindingProfiles,
              [state.activeBindingProfileId]: {
                ...getActiveBindingProfile(state),
                bindings: cloneSwipeBindings(DEFAULT_SWIPE_BINDINGS),
              },
            },
          }));
        },
      },
    }),
    {
      name: "hyaway-review-queue", // Keeping this key for backward compatibility
      version: 5,
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
        activeBindingProfileId: state.activeBindingProfileId,
        bindingProfiles: state.bindingProfiles,
      }),
      // Migrations from older store shapes
      migrate: migrateReviewSettingsState,
    },
  ),
);

// Sync settings across tabs
setupCrossTabSync(useReviewSettingsStore);

// #endregion

// #region Migrations

type PersistedReviewSettingsStateBase = {
  shortcutsEnabled?: boolean;
  gesturesEnabled?: boolean;
  showGestureThresholds?: boolean;
  trackWatchHistory?: boolean;
  imageLoadMode?: ReviewImageLoadMode;
  renderQuality?: number;
  optimizeSizeThresholdMB?: number;
  immersiveMode?: boolean;
};

type PersistedReviewSettingsStateV0 = PersistedReviewSettingsStateBase & {
  horizontalThreshold?: number;
  verticalThreshold?: number;
  bindings?: SwipeBindings;
};

type PersistedReviewSettingsStateV1 = Omit<
  PersistedReviewSettingsStateV0,
  "horizontalThreshold" | "verticalThreshold"
> & {
  thresholds?: SwipeThresholds;
};

type PersistedReviewSettingsStateV2 = PersistedReviewSettingsStateV1;

type PersistedReviewSettingsStateV3 = PersistedReviewSettingsStateV2;

type PersistedReviewSettingsStateV4 = PersistedReviewSettingsStateV3;

type PersistedReviewSettingsStateV5 = Omit<
  PersistedReviewSettingsStateV4,
  "bindings"
> & {
  activeBindingProfileId?: string;
  bindingProfiles?: ReviewBindingProfiles;
};

type MigratedReviewSettingsState = Partial<
  Omit<ReviewSettingsState, "actions">
> & {
  activeBindingProfileId: string;
  bindingProfiles: ReviewBindingProfiles;
};

export function migrateReviewSettingsState(
  persisted: unknown,
  version: number,
): MigratedReviewSettingsState {
  const v1State =
    version < 1
      ? migrateReviewSettingsStateV0ToV1(
          getPersistedReviewSettingsState<PersistedReviewSettingsStateV0>(
            persisted,
          ),
        )
      : getPersistedReviewSettingsState<PersistedReviewSettingsStateV1>(
          persisted,
        );

  const v2State =
    version < 2
      ? migrateReviewSettingsStateV1ToV2(v1State)
      : getPersistedReviewSettingsState<PersistedReviewSettingsStateV2>(
          persisted,
        );

  const v3State =
    version < 3
      ? migrateReviewSettingsStateV2ToV3(v2State)
      : getPersistedReviewSettingsState<PersistedReviewSettingsStateV3>(
          persisted,
        );

  const v4State =
    version < 4
      ? migrateReviewSettingsStateV3ToV4(v3State)
      : getPersistedReviewSettingsState<PersistedReviewSettingsStateV4>(
          persisted,
        );

  const v5State =
    version < 5
      ? migrateReviewSettingsStateV4ToV5(v4State)
      : getPersistedReviewSettingsState<PersistedReviewSettingsStateV5>(
          persisted,
        );

  return normalizeReviewSettingsStateProfiles(v5State);
}

function getPersistedReviewSettingsState<TState>(persisted: unknown): TState {
  return (
    persisted && typeof persisted === "object" ? persisted : {}
  ) as TState;
}

function normalizeReviewSettingsStateProfiles(
  state: PersistedReviewSettingsStateV5,
): PersistedReviewSettingsStateV5 & {
  activeBindingProfileId: string;
  bindingProfiles: ReviewBindingProfiles;
} {
  // Rebuild each persisted profile with a stable shape and normalized bindings.
  const rawProfiles = state.bindingProfiles;
  const profiles = rawProfiles ?? createDefaultBindingProfiles();
  const normalizedEntries = Object.values(profiles).map((profile) => {
    const rawProfile = profile as Partial<ReviewBindingProfile>;
    const profileId = rawProfile.id || getAvailableBindingProfileId(profiles);
    return [
      profileId,
      {
        id: profileId,
        name: normalizeBindingProfileName(rawProfile.name ?? ""),
        bindings: normalizeSwipeBindings(
          cloneSwipeBindings(rawProfile.bindings ?? DEFAULT_SWIPE_BINDINGS),
        ),
      },
    ] as const;
  });

  // If persisted data had no usable profile entries, keep the store operable.
  let nextProfiles = Object.fromEntries(normalizedEntries);
  if (Object.keys(nextProfiles).length === 0) {
    nextProfiles = createDefaultBindingProfiles();
  }

  // Preserve profile IDs while resolving duplicate display names.
  const deduplicatedProfiles: ReviewBindingProfiles = {};
  for (const profile of Object.values(nextProfiles)) {
    const name = getUniqueBindingProfileName(
      deduplicatedProfiles,
      profile.name,
    );
    deduplicatedProfiles[profile.id] = { ...profile, name };
  }

  // Fall back to the first sorted profile if the active profile was removed.
  const requestedActiveBindingProfileId = state.activeBindingProfileId ?? "";
  const activeBindingProfileId = getBindingProfile(
    deduplicatedProfiles,
    requestedActiveBindingProfileId,
  )
    ? requestedActiveBindingProfileId
    : getSortedBindingProfiles(deduplicatedProfiles)[0].id;

  return {
    ...state,
    activeBindingProfileId,
    bindingProfiles: deduplicatedProfiles,
  };
}

function migrateReviewSettingsStateV0ToV1(
  state: PersistedReviewSettingsStateV0,
): PersistedReviewSettingsStateV1 {
  const {
    horizontalThreshold: rawHorizontalThreshold,
    verticalThreshold: rawVerticalThreshold,
    ...rest
  } = state;
  const horizontal =
    typeof rawHorizontalThreshold === "number"
      ? rawHorizontalThreshold
      : DEFAULT_HORIZONTAL_THRESHOLD;
  const vertical =
    typeof rawVerticalThreshold === "number"
      ? rawVerticalThreshold
      : DEFAULT_VERTICAL_THRESHOLD;

  return {
    ...rest,
    thresholds: {
      left: horizontal,
      right: horizontal,
      up: vertical,
      down: vertical,
    },
  };
}

function migrateReviewSettingsStateV1ToV2(
  state: PersistedReviewSettingsStateV1,
): PersistedReviewSettingsStateV2 {
  const bindings = state.bindings;
  if (
    bindings?.down &&
    bindings.down.fileAction === "skip" &&
    !bindings.down.secondaryActions?.length
  ) {
    return {
      ...state,
      bindings: {
        ...bindings,
        down: { fileAction: "undo" },
      },
    };
  }

  return state;
}

function migrateReviewSettingsStateV2ToV3(
  state: PersistedReviewSettingsStateV2,
): PersistedReviewSettingsStateV3 {
  const thresholds = state.thresholds;
  if (!thresholds) return state;

  return {
    ...state,
    thresholds: {
      left: Math.min(
        MAX_SWIPE_THRESHOLD,
        Math.max(MIN_SWIPE_THRESHOLD, thresholds.left || MIN_SWIPE_THRESHOLD),
      ),
      right: Math.min(
        MAX_SWIPE_THRESHOLD,
        Math.max(MIN_SWIPE_THRESHOLD, thresholds.right || MIN_SWIPE_THRESHOLD),
      ),
      up: Math.min(
        MAX_SWIPE_THRESHOLD,
        Math.max(MIN_SWIPE_THRESHOLD, thresholds.up || MIN_SWIPE_THRESHOLD),
      ),
      down: Math.min(
        MAX_SWIPE_THRESHOLD,
        Math.max(MIN_SWIPE_THRESHOLD, thresholds.down || MIN_SWIPE_THRESHOLD),
      ),
    },
  };
}

function migrateReviewSettingsStateV3ToV4(
  state: PersistedReviewSettingsStateV3,
): PersistedReviewSettingsStateV4 {
  const bindings = state.bindings;
  if (!bindings) return state;

  return {
    ...state,
    bindings: normalizeSwipeBindings(bindings),
  };
}

function migrateReviewSettingsStateV4ToV5(
  state: PersistedReviewSettingsStateV4,
): PersistedReviewSettingsStateV5 {
  const { bindings, ...rest } = state;

  return {
    ...rest,
    activeBindingProfileId: DEFAULT_BINDING_PROFILE_ID,
    bindingProfiles: createDefaultBindingProfiles(bindings),
  };
}

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

/** Get all binding profiles sorted by display name */
export const useReviewBindingProfiles = () =>
  useReviewSettingsStore(
    useShallow((state) => getSortedBindingProfiles(state.bindingProfiles)),
  );

/** Get the active binding profile ID */
export const useActiveReviewBindingProfileId = () =>
  useReviewSettingsStore((state) => state.activeBindingProfileId);

/** Get the active binding profile */
export const useActiveReviewBindingProfile = () =>
  useReviewSettingsStore((state) => getActiveBindingProfile(state));

/** Get the active binding profile name */
export const useActiveReviewBindingProfileName = () =>
  useReviewSettingsStore((state) => getActiveBindingProfile(state).name);

/** Get the complete bindings object */
export const useReviewSwipeBindings = () =>
  useReviewSettingsStore((state) => getActiveBindingProfile(state).bindings);

/** Get the binding for a specific direction */
export const useReviewSwipeBinding = (direction: SwipeDirection) =>
  useReviewSettingsStore(
    (state) => getActiveBindingProfile(state).bindings[direction],
  );

/** Get actions */
export const useReviewSettingsActions = () =>
  useReviewSettingsStore((state) => state.actions);

/**
 * Get the file action for a direction (if any).
 * Convenience selector for common use case.
 */
export const useFileActionForDirection = (direction: SwipeDirection) =>
  useReviewSettingsStore(
    (state) => getActiveBindingProfile(state).bindings[direction].fileAction,
  );

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
