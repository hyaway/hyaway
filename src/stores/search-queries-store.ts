// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/shallow";
import type { RuleGroupType } from "react-querybuilder";
import type { SearchQueryEntry, SortConfig } from "@/stores/search-defaults";
import {
  createSearchRule,
  emptyStaged,
  serializeSearchQueryForComparison,
} from "@/stores/search-defaults";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";
import {
  getDefaultQuery,
  getSearchResultsInstantDefault,
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
    setStagedQuery: (
      key: string,
      query: RuleGroupType,
      displayName?: string,
    ) => void;
    /** Set the user-facing display name for an entry. */
    setDisplayName: (key: string, displayName: string) => void;
    /** Set whether an entry is pinned in search lists. */
    setPinned: (key: string, pinned: boolean) => void;
    /** Update the staged sort for an entry. */
    setStagedSort: (key: string, sort: SortConfig) => void;
    /** Update the staged file domain for an entry. */
    setStagedFileServiceKey: (
      key: string,
      fileServiceKey: string | null,
    ) => void;
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
    /** Create a new search from a tag string, commit it, and return its ID. */
    createFromTag: (tag: string) => string;
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

        setDisplayName: (key, displayName) => {
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

        setPinned: (key, pinned) => {
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

        setStagedSort: (key, sort) => {
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

        setStagedFileServiceKey: (key, fileServiceKey) => {
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

        commit: (key) => {
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

        reset: (key) => {
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

        clear: (key) => {
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
          const now = Date.now();
          set({
            entries: {
              [toKey]: {
                staged: source.staged,
                committed: source.committed ?? source.staged,
                createdAt: now,
                modifiedAt: now,
                displayName: cloneName,
                pinned: false,
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
                [fromKey]: markEntryModified({
                  ...source,
                  displayName: newDisplayName,
                }),
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
                createdAt: source.createdAt,
                modifiedAt: Date.now(),
                displayName: newDisplayName,
                pinned: source.pinned,
              };
            } else {
              newEntries[key] = entries[key];
            }
          }
          set({ entries: newEntries });
        },

        createFromTag: (tag) => {
          const displayName = nextUniqueName(tag);
          const searchId = generateSearchId(displayName);

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
export const usePinnedSearchKeys = () =>
  useSearchQueriesStore(
    useShallow((state) =>
      Object.keys(state.entries).filter((key) => state.entries[key].pinned),
    ),
  );

/** Get unpinned search keys. */
export const useOtherSearchKeys = () =>
  useSearchQueriesStore(
    useShallow((state) =>
      Object.keys(state.entries).filter((key) => !state.entries[key].pinned),
    ),
  );

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
  useSearchQueriesStore.getState().actions.commit(key);

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
