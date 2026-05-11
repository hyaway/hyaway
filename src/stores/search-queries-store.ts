// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/shallow";
import type { RuleGroupType } from "react-querybuilder";
import type { SearchQueryEntry, SortConfig } from "@/stores/search-defaults";
import { DEFAULT_SEARCH_KEY } from "@/stores/search-defaults";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";
import { getDefaultQuery } from "@/stores/search-settings-store";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function defaultEntry(): SearchQueryEntry {
  return {
    staged: getDefaultQuery(),
    committed: undefined,
  };
}

function defaultEntries(): Record<string, SearchQueryEntry> {
  return {
    [DEFAULT_SEARCH_KEY]: { ...defaultEntry(), displayName: "Draft" },
  };
}

const DRAFT_BASE = "Draft";

/** Get the next available "Draft" / "Draft (N)" name based on existing entries. */
export function nextDraftName(): string {
  const entries = useSearchQueriesStore.getState().entries;
  let max = -1;
  for (const entry of Object.values(entries)) {
    const name = entry.displayName ?? "";
    if (name === DRAFT_BASE) {
      if (0 > max) max = 0;
    } else if (name.startsWith(`${DRAFT_BASE} (`)) {
      const inner = name.slice(DRAFT_BASE.length + 2, -1);
      if (/^\d+$/.test(inner)) {
        const n = Number(inner);
        if (n > max) max = n;
      }
    }
  }
  if (max === -1) return DRAFT_BASE;
  return `${DRAFT_BASE} (${max + 1})`;
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
      entries: defaultEntries(),
      actions: {
        setStagedQuery: (key, query, displayName) => {
          const { entries } = get();
          const existing = key in entries;
          const entry = entries[key] ?? defaultEntry();
          const updated = {
            ...entry,
            staged: { ...entry.staged, query },
            ...(displayName != null && { displayName }),
          };
          set({
            entries: existing
              ? { ...entries, [key]: updated }
              : { [key]: updated, ...entries },
          });
        },

        setDisplayName: (key, displayName) => {
          const { entries } = get();
          const existing = key in entries;
          const entry = entries[key] ?? defaultEntry();
          const updated = { ...entry, displayName };
          set({
            entries: existing
              ? { ...entries, [key]: updated }
              : { [key]: updated, ...entries },
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
                staged: current.committed ?? getDefaultQuery(),
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
                staged: getDefaultQuery(),
              },
            },
          });
        },

        remove: (key) => {
          const { entries } = get();
          const { [key]: _, ...rest } = entries;
          set({
            entries: Object.keys(rest).length > 0 ? rest : defaultEntries(),
          });
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
  useSearchQueriesStore(
    (state) =>
      (state.entries[key] as SearchQueryEntry | undefined)?.displayName ?? key,
  );

/** Get display name outside of React (falls back to key). */
export const getSearchDisplayName = (key: string) => {
  const entry = useSearchQueriesStore.getState().entries[key] as
    | SearchQueryEntry
    | undefined;
  return entry?.displayName ?? key;
};

/** Delete all search queries and reset to default state. */
export const clearSearchQueries = () =>
  useSearchQueriesStore.setState({ entries: defaultEntries() });
