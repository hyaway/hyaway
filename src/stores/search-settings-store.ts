// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SearchState } from "@/stores/search-defaults";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";
import { defaultStaged, ensureSearchQueryIds } from "@/stores/search-defaults";

type SearchSettingsState = {
  /** Default query+sort for new search entries and clear/reset. */
  defaultQuery: SearchState;
  /** Whether search result pages commit staged edits immediately by default. */
  searchResultsInstantDefault: boolean;
  /** Whether search result pages open with the query builder expanded by default. */
  searchResultsBuilderDefault: boolean;
  actions: {
    setDefaultQuery: (state: SearchState) => void;
    setSearchResultsInstantDefault: (enabled: boolean) => void;
    setSearchResultsBuilderDefault: (enabled: boolean) => void;
    resetDefaultQuery: () => void;
    reset: () => void;
  };
};

const useSearchSettingsStore = create<SearchSettingsState>()(
  persist(
    (set, _get, store) => ({
      defaultQuery: defaultStaged(),
      searchResultsInstantDefault: true,
      searchResultsBuilderDefault: false,
      actions: {
        setDefaultQuery: (defaultQuery: SearchState) =>
          set({
            defaultQuery: {
              ...defaultQuery,
              query: ensureSearchQueryIds(defaultQuery.query),
            },
          }),
        setSearchResultsInstantDefault: (
          searchResultsInstantDefault: boolean,
        ) => set({ searchResultsInstantDefault }),
        setSearchResultsBuilderDefault: (
          searchResultsBuilderDefault: boolean,
        ) => set({ searchResultsBuilderDefault }),
        resetDefaultQuery: () => set({ defaultQuery: defaultStaged() }),
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

export const useDefaultQuery = () =>
  useSearchSettingsStore((state) => state.defaultQuery);

export const useSearchResultsInstantDefault = () =>
  useSearchSettingsStore((state) => state.searchResultsInstantDefault);

export const useSearchResultsBuilderDefault = () =>
  useSearchSettingsStore((state) => state.searchResultsBuilderDefault);

export const getSearchResultsInstantDefault = () =>
  useSearchSettingsStore.getState().searchResultsInstantDefault;

export const getDefaultQuery = (): SearchState => {
  const { query, sort, fileServiceKey } =
    useSearchSettingsStore.getState().defaultQuery;
  const queryWithIds = ensureSearchQueryIds(query);
  return {
    query: { ...queryWithIds, rules: [...queryWithIds.rules] },
    sort: { ...sort },
    fileServiceKey: fileServiceKey ?? null,
  };
};

export const useSearchSettingsActions = () =>
  useSearchSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useSearchSettingsStore);
