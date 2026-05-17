// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/shallow";
import type { RuleGroupType } from "react-querybuilder";
import type {
  SearchQueryEntry,
  SearchState,
  SortConfig,
} from "@/stores/search-defaults";
import type { SavedSearchSort } from "@/stores/search-settings-store";
import {
  createSearchRule,
  emptyStaged,
  serializeSearchQueryForComparison,
} from "@/stores/search-defaults";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";
import {
  getDefaultQuery,
  getSearchResultsInstantDefault,
  useSavedSearchSort,
} from "@/stores/search-settings-store";
import { generateSearchId } from "@/lib/search-entry-utils";
import { isIgnorableTagRuleValue } from "@/lib/search-rule-utils";
import { systemTagToRule } from "@/routes/_auth/(search)/-lib/query-builder-fields";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Remove ignorable tag rules and empty sub-groups (recursively). */
function stripEmptyRules(query: RuleGroupType): RuleGroupType {
  const rules = query.rules
    .map((rule) => {
      if ("rules" in rule) return stripEmptyRules(rule);
      return rule;
    })
    .filter(
      (rule) =>
        ("rules" in rule && rule.rules.length > 0) ||
        (!("rules" in rule) &&
          (rule.field !== "tag" || !isIgnorableTagRuleValue(rule.value))),
    );

  if (rules.length === query.rules.length) return query;
  return { ...query, rules };
}

function areSearchStatesEquivalent(
  staged: SearchQueryEntry["staged"],
  committed: SearchQueryEntry["committed"],
): boolean {
  if (!committed) return false;
  if (staged === committed) return true;

  return (
    staged.sort.sortType === committed.sort.sortType &&
    staged.sort.sortAsc === committed.sort.sortAsc &&
    staged.fileServiceKey === committed.fileServiceKey &&
    serializeSearchQueryForComparison(stripEmptyRules(staged.query)) ===
      serializeSearchQueryForComparison(committed.query)
  );
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function defaultEntry(): SearchQueryEntry {
  const now = Date.now();
  return {
    staged: getDefaultQuery(),
    committed: undefined,
    createdAt: now,
    modifiedAt: now,
    pinned: false,
  };
}

function markEntryModified(entry: SearchQueryEntry): SearchQueryEntry {
  return {
    ...entry,
    modifiedAt: Date.now(),
  };
}

function compareSearchEntries(
  left: [string, SearchQueryEntry],
  right: [string, SearchQueryEntry],
  sort: SavedSearchSort,
): number {
  const [leftKey, leftEntry] = left;
  const [rightKey, rightEntry] = right;

  let timeComparison: number;
  switch (sort) {
    case "newest-first":
      timeComparison = rightEntry.createdAt - leftEntry.createdAt;
      break;
    case "oldest-first":
      timeComparison = leftEntry.createdAt - rightEntry.createdAt;
      break;
    case "modified-desc":
      timeComparison = rightEntry.modifiedAt - leftEntry.modifiedAt;
      break;
  }

  if (timeComparison !== 0) return timeComparison;
  return leftKey.localeCompare(rightKey);
}

function getSortedSearchKeys(
  entries: Record<string, SearchQueryEntry>,
  sort: SavedSearchSort,
  pinned: boolean,
): Array<string> {
  return Object.entries(entries)
    .filter(([, entry]) => entry.pinned === pinned)
    .sort((left, right) => compareSearchEntries(left, right, sort))
    .map(([key]) => key);
}

function getAvailableGeneratedSearchKey(
  entries: Record<string, SearchQueryEntry>,
  displayName: string,
): string {
  let nextKey = generateSearchId(displayName);
  while (nextKey in entries) {
    nextKey = generateSearchId(displayName);
  }
  return nextKey;
}

function getAvailableNewSearchKey(
  entries: Record<string, SearchQueryEntry>,
  preferredKey: string,
  displayName: string,
): string {
  if (!(preferredKey in entries)) return preferredKey;
  return getAvailableGeneratedSearchKey(entries, displayName);
}

function getAvailableSearchKey(
  entries: Record<string, SearchQueryEntry>,
  fromKey: string,
  preferredKey: string,
  displayName: string,
): string {
  if (fromKey === preferredKey || !(preferredKey in entries)) {
    return preferredKey;
  }

  return getAvailableGeneratedSearchKey(entries, displayName);
}

function defaultEntries(): Record<string, SearchQueryEntry> {
  return {};
}

const DRAFT_BASE = "Draft";

/**
 * Get the next available unique name for a given base.
 * If "Base" exists, returns "Base (1)". If "Base (1)" exists, returns "Base (2)", etc.
 * If no match exists, returns the base as-is.
 */
export function nextUniqueName(base: string): string {
  const entries = useSearchQueriesStore.getState().entries;
  let max = -1;
  for (const entry of Object.values(entries)) {
    const name = entry.displayName ?? "";
    if (name === base) {
      if (0 > max) max = 0;
    } else if (name.startsWith(`${base} (`)) {
      const inner = name.slice(base.length + 2, -1);
      if (/^\d+$/.test(inner)) {
        const n = Number(inner);
        if (n > max) max = n;
      }
    }
  }
  if (max === -1) return base;
  return `${base} (${max + 1})`;
}

/** Get the next available "Draft" / "Draft (N)" name based on existing entries. */
export function nextDraftName(): string {
  return nextUniqueName(DRAFT_BASE);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type SearchQueriesState = {
  entries: Record<string, SearchQueryEntry>;
  actions: {
    /** Update the staged query for an entry (creates if missing). */
    setSearchStagedQuery: (
      key: string,
      query: RuleGroupType,
      displayName?: string,
    ) => void;
    /** Set the user-facing display name for an entry. */
    setSearchDisplayName: (key: string, displayName: string) => void;
    /** Set whether an entry is pinned in search lists. */
    setSearchPinned: (key: string, pinned: boolean) => void;
    /** Update the staged sort for an entry. */
    setSearchStagedSort: (key: string, sort: SortConfig) => void;
    /** Update the staged file domain for an entry. */
    setSearchStagedFileServiceKey: (
      key: string,
      fileServiceKey: string | null,
    ) => void;
    /** Commit: copies staged → committed. */
    commitSearchEntry: (key: string) => void;
    /** Reset staged state to the last committed search snapshot. */
    resetSearchEntryToLastCommit: (key: string) => void;
    /** Reset staged state to an empty query. */
    resetSearchEntryToEmpty: (key: string) => void;
    /** Clear all search entries. */
    clearSavedSearches: () => void;
    /** Clear unpinned search entries while preserving pinned searches. */
    clearUnpinnedSearches: () => void;
    /** Remove an entry entirely. */
    removeSearchEntry: (key: string) => void;
    /** Create a new search entry and return its key. */
    createSearchEntry: (
      displayName: string,
      state?: SearchState,
      options?: { commit?: boolean },
    ) => string;
    /** Copy an entry's current state to a new key and return the new key. */
    duplicateSearchEntry: (fromKey: string) => string;
    /** Move an entry to a new key (rename). */
    renameSearchEntry: (
      fromKey: string,
      toKey: string,
      displayName: string,
    ) => string;
    /** Create a new search from a tag string, commit it, and return its ID. */
    createSearchFromTag: (tag: string) => string;
  };
};

const useSearchQueriesStore = create<SearchQueriesState>()(
  persist(
    (set, get) => ({
      entries: defaultEntries(),
      actions: {
        setSearchStagedQuery: (key, query, displayName) => {
          const { entries } = get();
          const existing = key in entries;
          const entry = entries[key] ?? defaultEntry();
          const updated = markEntryModified({
            ...entry,
            staged: { ...entry.staged, query },
            ...(displayName != null && { displayName }),
          });
          set({
            entries: existing
              ? { ...entries, [key]: updated }
              : { [key]: updated, ...entries },
          });
        },

        setSearchDisplayName: (key, displayName) => {
          const { entries } = get();
          const existing = key in entries;
          const entry = entries[key] ?? defaultEntry();
          const updated = markEntryModified({ ...entry, displayName });
          set({
            entries: existing
              ? { ...entries, [key]: updated }
              : { [key]: updated, ...entries },
          });
        },

        setSearchPinned: (key, pinned) => {
          const { entries } = get();
          const existing = key in entries;
          const entry = entries[key] ?? defaultEntry();
          const updated = markEntryModified({ ...entry, pinned });
          set({
            entries: existing
              ? { ...entries, [key]: updated }
              : { [key]: updated, ...entries },
          });
        },

        setSearchStagedSort: (key, sort) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: {
                ...markEntryModified(entry),
                staged: { ...entry.staged, sort },
              },
            },
          });
        },

        setSearchStagedFileServiceKey: (key, fileServiceKey) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: {
                ...markEntryModified(entry),
                staged: { ...entry.staged, fileServiceKey },
              },
            },
          });
        },

        commitSearchEntry: (key) => {
          const { entries } = get();
          const entry = entries[key] ?? defaultEntry();
          const cleanedQuery = stripEmptyRules(entry.staged.query);
          const committed =
            cleanedQuery !== entry.staged.query
              ? { ...entry.staged, query: cleanedQuery }
              : entry.staged;
          set({
            entries: {
              ...entries,
              [key]: markEntryModified({ ...entry, committed }),
            },
          });
        },

        resetSearchEntryToLastCommit: (key) => {
          const { entries } = get();
          const current = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: {
                ...markEntryModified(current),
                staged: current.committed ?? getDefaultQuery(),
              },
            },
          });
        },

        resetSearchEntryToEmpty: (key) => {
          const { entries } = get();
          const current = entries[key] ?? defaultEntry();
          set({
            entries: {
              ...entries,
              [key]: {
                ...markEntryModified(current),
                staged: emptyStaged(),
              },
            },
          });
        },

        clearSavedSearches: () => {
          set({ entries: defaultEntries() });
        },

        clearUnpinnedSearches: () => {
          const { entries } = get();
          const pinnedEntries = Object.fromEntries(
            Object.entries(entries).filter(([, entry]) => entry.pinned),
          );

          set({
            entries:
              Object.keys(pinnedEntries).length > 0
                ? pinnedEntries
                : defaultEntries(),
          });
        },

        removeSearchEntry: (key) => {
          const { entries } = get();
          const { [key]: _, ...rest } = entries;
          set({
            entries: Object.keys(rest).length > 0 ? rest : defaultEntries(),
          });
        },

        createSearchEntry: (
          displayName,
          state = getDefaultQuery(),
          options,
        ) => {
          const { entries } = get();
          const searchId = getAvailableGeneratedSearchKey(entries, displayName);
          const now = Date.now();
          set({
            entries: {
              [searchId]: {
                staged: state,
                committed: options?.commit ? state : undefined,
                createdAt: now,
                modifiedAt: now,
                displayName,
                pinned: false,
              },
              ...entries,
            },
          });
          return searchId;
        },

        duplicateSearchEntry: (fromKey) => {
          const { entries } = get();
          const source = entries[fromKey] ?? defaultEntry();
          const baseName = source.displayName ?? fromKey;
          const match = baseName.match(/^(.*?)\s*\((\d+)\)$/);
          const cloneName = nextUniqueName(match ? match[1] : baseName);
          const targetKey = getAvailableNewSearchKey(
            entries,
            generateSearchId(cloneName),
            cloneName,
          );
          const now = Date.now();
          set({
            entries: {
              [targetKey]: {
                ...source,
                committed: source.committed ?? source.staged,
                createdAt: now,
                modifiedAt: now,
                displayName: cloneName,
                pinned: false,
              },
              ...entries,
            },
          });
          return targetKey;
        },

        renameSearchEntry: (fromKey, toKey, newDisplayName) => {
          const { entries } = get();
          const source = entries[fromKey] ?? defaultEntry();
          const targetKey = getAvailableSearchKey(
            entries,
            fromKey,
            toKey,
            newDisplayName,
          );

          if (fromKey === targetKey) {
            set({
              entries: {
                ...entries,
                [fromKey]: markEntryModified({
                  ...source,
                  displayName: newDisplayName,
                }),
              },
            });
            return targetKey;
          }

          if (!(fromKey in entries)) {
            set({
              entries: {
                ...entries,
                [targetKey]: markEntryModified({
                  ...source,
                  displayName: newDisplayName,
                }),
              },
            });
            return targetKey;
          }

          const newEntries: typeof entries = {};
          for (const key of Object.keys(entries)) {
            if (key === fromKey) {
              newEntries[targetKey] = {
                ...source,
                modifiedAt: Date.now(),
                displayName: newDisplayName,
              };
            } else {
              newEntries[key] = entries[key];
            }
          }
          set({ entries: newEntries });
          return targetKey;
        },

        createSearchFromTag: (tag) => {
          const displayName = nextUniqueName(tag);

          const base = getDefaultQuery();
          const systemRule = systemTagToRule(tag);
          const primaryRule = createSearchRule(
            systemRule ?? {
              field: "tag",
              operator: "=",
              value: tag,
            },
          );
          // Keep default rules that don't exactly match the tag at root level
          // (positive "tag" and negative "-tag" are treated as distinct values)
          const filteredRules = base.query.rules.filter(
            (r) =>
              !("field" in r) ||
              r.field !== primaryRule.field ||
              r.value !== primaryRule.value,
          );
          const query: RuleGroupType = {
            combinator: "and",
            rules: [primaryRule, ...filteredRules],
          };
          const state = {
            query,
            sort: base.sort,
            fileServiceKey: base.fileServiceKey ?? null,
          };
          const instantSearch = getSearchResultsInstantDefault();
          const now = Date.now();

          const { entries } = get();
          const searchId = getAvailableGeneratedSearchKey(entries, displayName);
          set({
            entries: {
              [searchId]: {
                staged: state,
                committed: instantSearch ? state : undefined,
                createdAt: now,
                modifiedAt: now,
                displayName,
                pinned: false,
              },
              ...entries,
            },
          });
          return searchId;
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

/** True when staged and committed are not the same snapshot. */
export const useSearchDirty = (key: string) =>
  useSearchQueriesStore((state) => {
    const entry = state.entries[key] as SearchQueryEntry | undefined;
    if (!entry) return false;
    return !areSearchStatesEquivalent(entry.staged, entry.committed);
  });

export const useSearchQueriesActions = () =>
  useSearchQueriesStore((state) => state.actions);

export const useSearchQueryCount = () =>
  useSearchQueriesStore((state) => Object.keys(state.entries).length);

/** Get all search keys. */
export const useSearchKeys = () =>
  useSearchQueriesStore(useShallow((state) => Object.keys(state.entries)));

/** Get pinned search keys. */
export const usePinnedSearchKeys = () => {
  const sort = useSavedSearchSort();
  return useSearchQueriesStore(
    useShallow((state) => getSortedSearchKeys(state.entries, sort, true)),
  );
};

/** Get unpinned search keys. */
export const useOtherSearchKeys = () => {
  const sort = useSavedSearchSort();
  return useSearchQueriesStore(
    useShallow((state) => getSortedSearchKeys(state.entries, sort, false)),
  );
};

/** Whether a search entry is pinned. */
export const useSearchPinned = (key: string) =>
  useSearchQueriesStore(
    (state) =>
      (state.entries[key] as SearchQueryEntry | undefined)?.pinned ?? false,
  );

/** Get display name for a search entry (falls back to key). */
export const useSearchDisplayName = (key: string) =>
  useSearchQueriesStore(
    (state) =>
      (state.entries[key] as SearchQueryEntry | undefined)?.displayName ?? key,
  );

/** Commit a search entry outside of React. */
export const commitSearch = (key: string) =>
  useSearchQueriesStore.getState().actions.commitSearchEntry(key);

/** Get display name outside of React (falls back to key). */
export const getSearchDisplayName = (key: string) => {
  const entry = useSearchQueriesStore.getState().entries[key] as
    | SearchQueryEntry
    | undefined;
  return entry?.displayName ?? key;
};
