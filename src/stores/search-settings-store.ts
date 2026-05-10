// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

type SearchSettingsState = {
  allowSystemOnlySearch: boolean;
  actions: {
    setAllowSystemOnlySearch: (allow: boolean) => void;
    reset: () => void;
  };
};

const useSearchSettingsStore = create<SearchSettingsState>()(
  persist(
    (set, _get, store) => ({
      allowSystemOnlySearch: false,
      actions: {
        setAllowSystemOnlySearch: (allowSystemOnlySearch: boolean) =>
          set({ allowSystemOnlySearch }),
        reset: () => set(store.getInitialState()),
      },
    }),
    {
      name: "hyaway-search-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useAllowSystemOnlySearch = () =>
  useSearchSettingsStore((state) => state.allowSystemOnlySearch);

export const useSearchSettingsActions = () =>
  useSearchSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useSearchSettingsStore);
