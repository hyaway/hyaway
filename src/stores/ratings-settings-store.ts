// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

/**
 * Per-service rating settings combining overlay and review button visibility.
 */
export interface RatingServiceSettings {
  /** Whether to show this rating on thumbnails */
  showInOverlay: boolean;
  /** Whether to show this rating on thumbnails even when unset/null */
  showInOverlayEvenWhenNull: boolean;
  /** Whether to show this rating in review mode buttons */
  showInReview: boolean;
  /** Whether this rating service should be displayed without edit controls */
  readOnly: boolean;
}

/**
 * Mode for determining overlay visibility settings.
 * - "service": Use Hydrus service settings (show_in_thumbnail, show_in_thumbnail_even_when_null)
 * - "custom": Use custom settings stored in this store
 */
export type RatingsOverlayMode = "service" | "custom";

type RatingsSettingsState = {
  /**
   * Mode for overlay visibility: "service" (use Hydrus settings) or "custom" (use custom settings).
   * Defaults to "custom". Only works when services provide show_in_thumbnail properties.
   */
  overlayMode: RatingsOverlayMode;
  /**
   * Map of service key to settings.
   * Services not in this map use the defaults.
   */
  serviceSettings: Record<string, RatingServiceSettings>;
  actions: {
    setOverlayMode: (mode: RatingsOverlayMode) => void;
    setShowInOverlay: (serviceKey: string, show: boolean) => void;
    setShowInOverlayEvenWhenNull: (serviceKey: string, show: boolean) => void;
    setShowInReview: (serviceKey: string, show: boolean) => void;
    setReadOnly: (serviceKey: string, readOnly: boolean) => void;
    getServiceSettings: (serviceKey: string) => RatingServiceSettings;
    removeServiceSettings: (serviceKey: string) => void;
    reset: () => void;
  };
};

export const DEFAULT_RATING_SERVICE_SETTINGS: RatingServiceSettings = {
  showInOverlay: true,
  showInOverlayEvenWhenNull: false,
  showInReview: true,
  readOnly: false,
};

export function getRatingServiceSettings(
  settings: Record<string, RatingServiceSettings>,
  serviceKey: string,
): RatingServiceSettings {
  return {
    ...DEFAULT_RATING_SERVICE_SETTINGS,
    ...settings[serviceKey],
  };
}

export function isRatingServiceReadOnly(
  settings: Record<string, RatingServiceSettings>,
  serviceKey: string,
): boolean {
  return getRatingServiceSettings(settings, serviceKey).readOnly;
}

export function getReadOnlyRatingServiceKeys(
  settings: Record<string, RatingServiceSettings>,
): Set<string> {
  return new Set(
    Object.entries(settings)
      .filter(
        ([serviceKey]) =>
          getRatingServiceSettings(settings, serviceKey).readOnly,
      )
      .map(([serviceKey]) => serviceKey),
  );
}

const useRatingsSettingsStore = create<RatingsSettingsState>()(
  persist(
    (set, get) => ({
      overlayMode: "service",
      serviceSettings: {},
      actions: {
        setOverlayMode: (overlayMode: RatingsOverlayMode) =>
          set({ overlayMode }),
        setShowInOverlay: (serviceKey: string, show: boolean) =>
          set((state) => ({
            serviceSettings: {
              ...state.serviceSettings,
              [serviceKey]: {
                ...DEFAULT_RATING_SERVICE_SETTINGS,
                ...state.serviceSettings[serviceKey],
                showInOverlay: show,
              },
            },
          })),
        setShowInOverlayEvenWhenNull: (serviceKey: string, show: boolean) =>
          set((state) => ({
            serviceSettings: {
              ...state.serviceSettings,
              [serviceKey]: {
                ...DEFAULT_RATING_SERVICE_SETTINGS,
                ...state.serviceSettings[serviceKey],
                showInOverlayEvenWhenNull: show,
              },
            },
          })),
        setShowInReview: (serviceKey: string, show: boolean) =>
          set((state) => ({
            serviceSettings: {
              ...state.serviceSettings,
              [serviceKey]: {
                ...DEFAULT_RATING_SERVICE_SETTINGS,
                ...state.serviceSettings[serviceKey],
                showInReview: show,
              },
            },
          })),
        setReadOnly: (serviceKey: string, readOnly: boolean) =>
          set((state) => ({
            serviceSettings: {
              ...state.serviceSettings,
              [serviceKey]: {
                ...DEFAULT_RATING_SERVICE_SETTINGS,
                ...state.serviceSettings[serviceKey],
                readOnly,
              },
            },
          })),
        getServiceSettings: (serviceKey: string): RatingServiceSettings =>
          getRatingServiceSettings(get().serviceSettings, serviceKey),
        removeServiceSettings: (serviceKey: string) =>
          set((state) => {
            const { [serviceKey]: _, ...rest } = state.serviceSettings;
            return { serviceSettings: rest };
          }),
        reset: () => set({ overlayMode: "custom", serviceSettings: {} }),
      },
    }),
    {
      name: "hyaway-ratings-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

/** Get the overlay mode setting */
export const useRatingsOverlayMode = () =>
  useRatingsSettingsStore((state) => state.overlayMode);

/** Get all service settings map */
export const useRatingsServiceSettings = () =>
  useRatingsSettingsStore((state) => state.serviceSettings);

/** Get the set of rating service keys marked read-only. */
export const useReadOnlyRatingServiceKeys = () => {
  const serviceSettings = useRatingsServiceSettings();
  return useMemo(
    () => getReadOnlyRatingServiceKeys(serviceSettings),
    [serviceSettings],
  );
};

/** Get actions for managing rating settings */
export const useRatingsSettingsActions = () =>
  useRatingsSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useRatingsSettingsStore);
