// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SearchState } from "@/stores/search-defaults";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";
import { DEFAULT_STAGED } from "@/stores/search-defaults";

type SearchSettingsState = {
  allowSystemOnlySearch: boolean;
  /** Default query+sort for new search entries and clear/reset. */
  defaultQuery: SearchState;
  actions: {
    setAllowSystemOnlySearch: (allow: boolean) => void;
    setDefaultQuery: (state: SearchState) => void;
    resetDefaultQuery: () => void;
    reset: () => void;
  };
};

const useSearchSettingsStore = create<SearchSettingsState>()(
  persist(
    (set, _get, store) => ({
      allowSystemOnlySearch: false,
      defaultQuery: DEFAULT_STAGED,
      actions: {
        setAllowSystemOnlySearch: (allowSystemOnlySearch: boolean) =>
          set({ allowSystemOnlySearch }),
        setDefaultQuery: (defaultQuery: SearchState) => set({ defaultQuery }),
        resetDefaultQuery: () => set({ defaultQuery: DEFAULT_STAGED }),
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

export const useDefaultQuery = () =>
  useSearchSettingsStore((state) => state.defaultQuery);

export const getDefaultQuery = () =>
  useSearchSettingsStore.getState().defaultQuery;

export const useSearchSettingsActions = () =>
  useSearchSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useSearchSettingsStore);
