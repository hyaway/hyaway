// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { generateID } from "@react-querybuilder/core";
import type { RuleGroupType, RuleType } from "react-querybuilder";
import { HydrusFileSortType } from "@/integrations/hydrus-api/models";

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
  fileServiceKey: string | null;
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function createSearchRule(rule: Omit<RuleType, "id">): RuleType {
  return { id: generateID(), ...rule } as RuleType;
}

function ensureSearchRuleId(rule: RuleType): RuleType {
  const id = rule.id;
  if (id != null && String(id).length > 0) return rule;

  return { ...rule, id: generateID() } as RuleType;
}

export function ensureSearchQueryIds(query: RuleGroupType): RuleGroupType {
  const rules = query.rules.map((ruleOrGroup) => {
    if ("rules" in ruleOrGroup) {
      const nestedGroup = ensureSearchQueryIds(ruleOrGroup);
      const id = nestedGroup.id;
      if (id != null && String(id).length > 0) return nestedGroup;
      return { ...nestedGroup, id: generateID() } as RuleGroupType;
    }

    return ensureSearchRuleId(ruleOrGroup);
  });

  return { ...query, rules };
}

export function serializeSearchQueryForComparison(
  query: RuleGroupType,
): string {
  const queryWithoutId: Record<string, unknown> = { ...query };
  delete queryWithoutId.id;
  queryWithoutId.rules = query.rules.map((ruleOrGroup) => {
    if ("rules" in ruleOrGroup) {
      return JSON.parse(serializeSearchQueryForComparison(ruleOrGroup));
    }

    const ruleWithoutId: Record<string, unknown> = { ...ruleOrGroup };
    delete ruleWithoutId.id;
    return ruleWithoutId;
  });

  return JSON.stringify(queryWithoutId);
}

function emptyQuery(): RuleGroupType {
  return {
    combinator: "and",
    rules: [],
  };
}

function defaultQuery(): RuleGroupType {
  return {
    combinator: "and",
    rules: [
      {
        id: generateID(),
        field: "limit",
        operator: "=",
        value: 256,
      },
    ],
  };
}

function defaultSort(): SortConfig {
  return {
    sortType: HydrusFileSortType.ImportTime,
    sortAsc: false,
  };
}

/** Empty staged state used by erase — bare query with no limit. */
export function emptyStaged(): SearchState {
  return { query: emptyQuery(), sort: defaultSort(), fileServiceKey: null };
}

/** Default staged state for new entries — includes limit 256. */
export function defaultStaged(): SearchState {
  return { query: defaultQuery(), sort: defaultSort(), fileServiceKey: null };
}

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
export const DEFAULT_SEARCH_KEY = "draft";
