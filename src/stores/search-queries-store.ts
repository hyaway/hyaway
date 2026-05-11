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
  /** User-facing name. Falls back to the entry key when absent. */
  displayName?: string;
};

/**
 * Default search entry key, pre-created on first use.
 */
export const DEFAULT_SEARCH_KEY = "search";

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
    setStagedQuery: (
      key: string,
      query: RuleGroupType,
      displayName?: string,
    ) => void;
    /** Set the user-facing display name for an entry. */
    setDisplayName: (key: string, displayName: string) => void;
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
    /** Move an entry to a new key (rename). */
    rename: (fromKey: string, toKey: string, displayName: string) => void;
  };
};

const useSearchQueriesStore = create<SearchQueriesState>()(
  persist(
    (set, get) => ({
      entries: { [DEFAULT_SEARCH_KEY]: defaultEntry() },
      actions: {
        setStagedQuery: (key, query, displayName) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: {
                ...entry,
                staged: { ...entry.staged, query },
                ...(displayName != null && { displayName }),
              },
            },
          });
        },

        setDisplayName: (key, displayName) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: { ...entry, displayName },
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
          const baseName = source.displayName ?? fromKey;
          const match = baseName.match(/^(.*?)\s*\((\d+)\)$/);
          const cloneName = match
            ? `${match[1]} (${Number(match[2]) + 1})`
            : `${baseName} (1)`;
          set({
            entries: {
              [toKey]: {
                staged: source.staged,
                committed: source.committed ?? source.staged,
                displayName: cloneName,
              },
              ...entries,
            },
          });
        },

        rename: (fromKey, toKey, newDisplayName) => {
          const { entries } = get();
          const source = entries[fromKey] ?? defaultEntry();
          if (fromKey === toKey) {
            set({
              entries: {
                ...entries,
                [fromKey]: { ...source, displayName: newDisplayName },
              },
            });
            return;
          }
          const newEntries: typeof entries = {};
          for (const key of Object.keys(entries)) {
            if (key === fromKey) {
              newEntries[toKey] = {
                staged: source.staged,
                committed: source.committed,
                displayName: newDisplayName,
              };
            } else {
              newEntries[key] = entries[key];
            }
          }
          set({ entries: newEntries });
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

/** Get all search keys. */
export const useSearchKeys = () =>
  useSearchQueriesStore(useShallow((state) => Object.keys(state.entries)));

/** Get display name for a search entry (falls back to key). */
export const useSearchDisplayName = (key: string) =>
  useSearchQueriesStore((state) => state.entries[key]?.displayName ?? key);

/** Get display name outside of React (falls back to key). */
export const getSearchDisplayName = (key: string) =>
  useSearchQueriesStore.getState().entries[key]?.displayName ?? key;

/** Delete all search queries (for settings). */
export const clearSearchQueries = () =>
  useSearchQueriesStore.setState({ entries: {} });
