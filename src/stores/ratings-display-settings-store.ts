// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

/**
 * Per-service rating display settings.
 * Uses Hydrus field naming for future API compatibility.
 */
export interface RatingServiceDisplaySettings {
  /** Whether to show this rating on thumbnails */
  show_in_thumbnail: boolean;
  /** Whether to show this rating on thumbnails even when unset/null */
  show_in_thumbnail_even_when_null: boolean;
}

type RatingsDisplaySettingsState = {
  /**
   * Map of service key to display settings.
   * Services not in this map use the defaults (both false).
   */
  serviceSettings: Record<string, RatingServiceDisplaySettings>;
  actions: {
    setServiceShowInThumbnail: (serviceKey: string, show: boolean) => void;
    setServiceShowEvenWhenNull: (serviceKey: string, show: boolean) => void;
    getServiceSettings: (serviceKey: string) => RatingServiceDisplaySettings;
    removeServiceSettings: (serviceKey: string) => void;
    reset: () => void;
  };
};

const DEFAULT_SERVICE_SETTINGS: RatingServiceDisplaySettings = {
  show_in_thumbnail: false,
  show_in_thumbnail_even_when_null: false,
};

const useRatingsDisplaySettingsStore = create<RatingsDisplaySettingsState>()(
  persist(
    (set, get) => ({
      serviceSettings: {},
      actions: {
        setServiceShowInThumbnail: (serviceKey: string, show: boolean) =>
          set((state) => ({
            serviceSettings: {
              ...state.serviceSettings,
              [serviceKey]: {
                ...(state.serviceSettings[serviceKey] ??
                  DEFAULT_SERVICE_SETTINGS),
                show_in_thumbnail: show,
              },
            },
          })),
        setServiceShowEvenWhenNull: (serviceKey: string, show: boolean) =>
          set((state) => ({
            serviceSettings: {
              ...state.serviceSettings,
              [serviceKey]: {
                ...(state.serviceSettings[serviceKey] ??
                  DEFAULT_SERVICE_SETTINGS),
                show_in_thumbnail_even_when_null: show,
              },
            },
          })),
        getServiceSettings: (
          serviceKey: string,
        ): RatingServiceDisplaySettings =>
          get().serviceSettings[serviceKey] ?? DEFAULT_SERVICE_SETTINGS,
        removeServiceSettings: (serviceKey: string) =>
          set((state) => {
            const { [serviceKey]: _, ...rest } = state.serviceSettings;
            return { serviceSettings: rest };
          }),
        reset: () => set({ serviceSettings: {} }),
      },
    }),
    {
      name: "hyaway-ratings-display-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useRatingsServiceSettings = () =>
  useRatingsDisplaySettingsStore((state) => state.serviceSettings);

export const useRatingsDisplaySettingsActions = () =>
  useRatingsDisplaySettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useRatingsDisplaySettingsStore);
