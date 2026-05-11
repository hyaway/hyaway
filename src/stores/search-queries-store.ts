// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/shallow";
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

/** Query + sort pair representing a complete search state. */
export type SearchState = {
  query: RuleGroupType;
  sort: SortConfig;
};

/** A single search entry with staged (being edited) and committed (active) state. */
export type SearchQueryEntry = {
  staged: SearchState;
  committed: SearchState | undefined;
};

/**
 * Well-known entry key for the scratchpad (unsaved) search page.
 * Always available, never deletable.
 */
export const SCRATCH_SEARCH_KEY = "scratchpad";

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

const DEFAULT_STAGED: SearchState = {
  query: EMPTY_QUERY,
  sort: DEFAULT_SORT,
};

function defaultEntry(): SearchQueryEntry {
  return {
    staged: DEFAULT_STAGED,
    committed: undefined,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type SearchQueriesState = {
  entries: Record<string, SearchQueryEntry>;
  actions: {
    /** Update the staged query for an entry (creates if missing). */
    setStagedQuery: (key: string, query: RuleGroupType) => void;
    /** Update the staged sort for an entry. */
    setStagedSort: (key: string, sort: SortConfig) => void;
    /** Commit: copies staged → committed. */
    commit: (key: string) => void;
    /** Reset: copies committed → staged (reverts edits). */
    reset: (key: string) => void;
    /** Clear: resets staged to the default empty query. */
    clear: (key: string) => void;
    /** Remove an entry entirely. */
    remove: (key: string) => void;
    /** Copy an entry's current state to a new key. */
    saveAs: (fromKey: string, toKey: string) => void;
  };
};

const useSearchQueriesStore = create<SearchQueriesState>()(
  persist(
    (set, get) => ({
      entries: {},
      actions: {
        setStagedQuery: (key, query) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: {
                ...entry,
                staged: { ...entry.staged, query },
              },
            },
          });
        },

        setStagedSort: (key, sort) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: {
                ...entry,
                staged: { ...entry.staged, sort },
              },
            },
          });
        },

        commit: (key) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: { ...entry, committed: entry.staged },
            },
          });
        },

        reset: (key) => {
          const { entries } = get();
          const current = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: {
                ...current,
                staged: current.committed ?? DEFAULT_STAGED,
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
              [key]: { ...current, staged: DEFAULT_STAGED },
            },
          });
        },

        remove: (key) => {
          const { entries } = get();
          const { [key]: _, ...rest } = entries;
          set({ entries: rest });
        },

        saveAs: (fromKey, toKey) => {
          const { entries } = get();
          const source = entries[fromKey] ?? defaultEntry();
          set({
            entries: {
              [toKey]: {
                staged: source.staged,
                committed: source.committed ?? source.staged,
              },
              ...entries,
            },
          });
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

const DEFAULT_ENTRY = defaultEntry();

/** Get a single search entry (returns a stable default when missing). */
export const useSearchQueryEntry = (key: string): SearchQueryEntry =>
  useSearchQueriesStore((state) => state.entries[key] ?? DEFAULT_ENTRY);

/** Get committed state for a search entry. */
export const useCommittedSearch = (key: string) =>
  useSearchQueriesStore(
    (state) => (state.entries[key] as SearchQueryEntry | undefined)?.committed,
  );

export const useSearchQueriesActions = () =>
  useSearchQueriesStore((state) => state.actions);

export const useSearchQueryCount = () =>
  useSearchQueriesStore((state) => Object.keys(state.entries).length);

/** Get all saved search keys (excludes scratchpad). */
export const useSavedSearchKeys = () =>
  useSearchQueriesStore(
    useShallow((state) =>
      Object.keys(state.entries).filter((k) => k !== SCRATCH_SEARCH_KEY),
    ),
  );

/** Generate a unique search page ID (e.g. "2026-05-10_a3f7"). */
export function generateSearchId(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  const date = local.toISOString().slice(0, 10);
  const hash = Math.random().toString(36).slice(2, 6);
  return `${date}_${hash}`;
}

/** Delete all search queries (for settings). */
export const clearSearchQueries = () =>
  useSearchQueriesStore.setState({ entries: {} });
