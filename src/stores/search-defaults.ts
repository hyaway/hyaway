// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { RuleGroupType } from "react-querybuilder";
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
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function emptyQuery(): RuleGroupType {
  return {
    combinator: "and",
    rules: [],
  };
}

function defaultQuery(): RuleGroupType {
  return {
    combinator: "and",
    rules: [{ field: "limit", operator: "=", value: 256 }],
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
  return { query: emptyQuery(), sort: defaultSort() };
}

/** Default staged state for new entries — includes limit 256. */
export function defaultStaged(): SearchState {
  return { query: defaultQuery(), sort: defaultSort() };
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
