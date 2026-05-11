// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RuleGroupType } from "react-querybuilder";
import { HydrusFileSortType } from "@/integrations/hydrus-api/models";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortConfig = {
  sortType: HydrusFileSortType;
  sortAsc: boolean;
};

/** A single search entry with staged (being edited) and committed (active) state. */
export type SearchQueryEntry = {
  staged: RuleGroupType;
  stagedSort: SortConfig;
  committed: RuleGroupType | undefined;
  committedSort: SortConfig | undefined;
};

/**
 * Well-known entry key for the main search page.
 *
 * Alternatives considered: "new", "default", "main", "scratch".
 */
export const PRIMARY_SEARCH_KEY = "primary";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const EMPTY_QUERY: RuleGroupType = {
  combinator: "and",
  rules: [{ field: "tag", operator: "=", value: "" }],
};

const DEFAULT_SORT: SortConfig = {
  sortType: HydrusFileSortType.ImportTime,
  sortAsc: true,
};

function defaultEntry(): SearchQueryEntry {
  return {
    staged: EMPTY_QUERY,
    stagedSort: DEFAULT_SORT,
    committed: undefined,
    committedSort: undefined,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type SearchQueriesState = {
  entries: Record<string, SearchQueryEntry>;
  actions: {
    /** Update the staged query for an entry (creates if missing). */
    setStaged: (key: string, query: RuleGroupType) => void;
    /** Update the staged sort for an entry. */
    setStagedSort: (key: string, sort: SortConfig) => void;
    /** Commit: copies staged → committed. Returns the committed entry. */
    commit: (key: string) => SearchQueryEntry | undefined;
    /** Reset: copies committed → staged (reverts edits). */
    reset: (key: string) => void;
    /** Clear: resets staged to the default empty query. */
    clear: (key: string) => void;
    /** Remove an entry entirely. */
    remove: (key: string) => void;
  };
};

const useSearchQueriesStore = create<SearchQueriesState>()(
  persist(
    (set, get) => ({
      entries: {},
      actions: {
        setStaged: (key, query) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          set({
            entries: { ...entries, [key]: { ...entry, staged: query } },
          });
        },

        setStagedSort: (key, sort) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          set({
            entries: { ...entries, [key]: { ...entry, stagedSort: sort } },
          });
        },

        commit: (key) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          const committed: SearchQueryEntry = {
            ...entry,
            committed: entry.staged,
            committedSort: entry.stagedSort,
          };
          set({ entries: { ...entries, [key]: committed } });
          return committed;
        },

        reset: (key) => {
          const { entries } = get();
          const current = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: {
                ...current,
                staged: current.committed ?? EMPTY_QUERY,
                stagedSort: current.committedSort ?? DEFAULT_SORT,
              },
            },
          });
        },

        clear: (key) => {
          const { entries } = get();
          const current = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: {
                ...current,
                staged: EMPTY_QUERY,
                stagedSort: DEFAULT_SORT,
              },
            },
          });
        },

        remove: (key) => {
          const { entries } = get();
          const { [key]: _, ...rest } = entries;
          set({ entries: rest });
        },
      },
    }),
    {
      name: "hyaway-search-queries",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

setupCrossTabSync(useSearchQueriesStore);

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

/** Get a single search entry (returns a stable default when missing). */
export const useSearchQueryEntry = (key: string): SearchQueryEntry =>
  useSearchQueriesStore((state) => state.entries[key] ?? defaultEntry());

export const useSearchQueriesActions = () =>
  useSearchQueriesStore((state) => state.actions);

export const useSearchQueryCount = () =>
  useSearchQueriesStore((state) => Object.keys(state.entries).length);

/** Delete all search queries (for settings). */
export const clearSearchQueries = () =>
  useSearchQueriesStore.setState({ entries: {} });
