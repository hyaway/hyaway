// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

type ReviewRatingsSettingsState = {
  /**
   * Set of service keys that are excluded from review rating.
   * Empty = all services enabled (default).
   * Services in this set are hidden from the Rate button.
   */
  excludedServiceKeys: Set<string>;
  actions: {
    /** Toggle a service's enabled state */
    toggleService: (serviceKey: string) => void;
    /** Check if a service is enabled (not excluded) */
    isServiceEnabled: (serviceKey: string) => boolean;
    /** Enable all services (clear exclusions) */
    enableAll: () => void;
    /** Disable all services (exclude all) */
    disableAll: (allServiceKeys: Array<string>) => void;
    /** Reset to defaults (all enabled) */
    reset: () => void;
  };
};

const useReviewRatingsSettingsStore = create<ReviewRatingsSettingsState>()(
  persist(
    (set, get) => ({
      excludedServiceKeys: new Set(),
      actions: {
        toggleService: (serviceKey: string) =>
          set((state) => {
            const newExcluded = new Set(state.excludedServiceKeys);
            if (newExcluded.has(serviceKey)) {
              newExcluded.delete(serviceKey);
            } else {
              newExcluded.add(serviceKey);
            }
            return { excludedServiceKeys: newExcluded };
          }),
        isServiceEnabled: (serviceKey: string) =>
          !get().excludedServiceKeys.has(serviceKey),
        enableAll: () => set({ excludedServiceKeys: new Set() }),
        disableAll: (allServiceKeys: Array<string>) =>
          set({ excludedServiceKeys: new Set(allServiceKeys) }),
        reset: () => set({ excludedServiceKeys: new Set() }),
      },
    }),
    {
      name: "hyaway-review-ratings-settings",
      storage: createJSONStorage(() => localStorage, {
        // Convert Set to array for JSON serialization
        replacer: (_key, value) => (value instanceof Set ? [...value] : value),
        reviver: (key, value) =>
          key === "excludedServiceKeys" && Array.isArray(value)
            ? new Set(value)
            : value,
      }),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

/** Get the set of excluded service keys */
export const useReviewRatingsExcludedServices = () =>
  useReviewRatingsSettingsStore((state) => state.excludedServiceKeys);

/** Get actions for managing review rating settings */
export const useReviewRatingsSettingsActions = () =>
  useReviewRatingsSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useReviewRatingsSettingsStore);
