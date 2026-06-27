// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SearchState } from "@/stores/search-defaults";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";
import { defaultStaged, ensureSearchQueryIds } from "@/stores/search-defaults";

const DEFAULT_SEARCH_RESULTS_INSTANT = true;
const DEFAULT_SEARCH_RESULTS_BUILDER = false;
const DEFAULT_DELETE_SEARCH_AFTER_PAGE_SAVE = false;
const DEFAULT_SAVED_SEARCH_SORT: SavedSearchSort = "newest-first";

export const SAVED_SEARCH_SORT_VALUES = [
  "newest-first",
  "oldest-first",
  "modified-desc",
] as const;

export type SavedSearchSort = (typeof SAVED_SEARCH_SORT_VALUES)[number];

export function isSavedSearchSort(value: string): value is SavedSearchSort {
  return SAVED_SEARCH_SORT_VALUES.includes(value as SavedSearchSort);
}

type SearchSettingsState = {
  /** Default query+sort for new search entries and clear/reset. */
  defaultQuery: SearchState;
  /** Whether search result pages commit staged edits immediately by default. */
  searchResultsInstantDefault: boolean;
  /** Whether search result pages open with the query builder expanded by default. */
  searchResultsBuilderDefault: boolean;
  /** Whether saved searches are deleted after creating a Hydrus page from them. */
  deleteSearchAfterPageSave: boolean;
  /** Ordering for saved search lists and menus. */
  savedSearchSort: SavedSearchSort;
  actions: {
    setDefaultQuery: (state: SearchState) => void;
    setSearchResultsInstantDefault: (enabled: boolean) => void;
    setSearchResultsBuilderDefault: (enabled: boolean) => void;
    setDeleteSearchAfterPageSave: (enabled: boolean) => void;
    setSavedSearchSort: (sort: SavedSearchSort) => void;
    resetDefaultQuery: () => void;
    resetSearchData: () => void;
    resetSearchAppearance: () => void;
    reset: () => void;
  };
};

const useSearchSettingsStore = create<SearchSettingsState>()(
  persist(
    (set, _get, store) => ({
      defaultQuery: defaultStaged(),
      searchResultsInstantDefault: DEFAULT_SEARCH_RESULTS_INSTANT,
      searchResultsBuilderDefault: DEFAULT_SEARCH_RESULTS_BUILDER,
      deleteSearchAfterPageSave: DEFAULT_DELETE_SEARCH_AFTER_PAGE_SAVE,
      savedSearchSort: DEFAULT_SAVED_SEARCH_SORT,
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
        setDeleteSearchAfterPageSave: (deleteSearchAfterPageSave: boolean) =>
          set({ deleteSearchAfterPageSave }),
        setSavedSearchSort: (savedSearchSort: SavedSearchSort) =>
          set({ savedSearchSort }),
        resetDefaultQuery: () => set({ defaultQuery: defaultStaged() }),
        resetSearchData: () =>
          set({
            defaultQuery: defaultStaged(),
            deleteSearchAfterPageSave: DEFAULT_DELETE_SEARCH_AFTER_PAGE_SAVE,
          }),
        resetSearchAppearance: () =>
          set({
            searchResultsInstantDefault: DEFAULT_SEARCH_RESULTS_INSTANT,
            searchResultsBuilderDefault: DEFAULT_SEARCH_RESULTS_BUILDER,
            savedSearchSort: DEFAULT_SAVED_SEARCH_SORT,
          }),
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

export const useDeleteSearchAfterPageSave = () =>
  useSearchSettingsStore((state) => state.deleteSearchAfterPageSave);

export const useSavedSearchSort = () =>
  useSearchSettingsStore((state) => state.savedSearchSort);

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
