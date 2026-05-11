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

const EMPTY_QUERY: RuleGroupType = {
  combinator: "and",
  rules: [{ field: "tag", operator: "=", value: "" }],
};

const DEFAULT_QUERY: RuleGroupType = {
  combinator: "and",
  rules: [
    { field: "tag", operator: "=", value: "" },
    { field: "limit", operator: "=", value: 256 },
  ],
};

const DEFAULT_SORT: SortConfig = {
  sortType: HydrusFileSortType.ImportTime,
  sortAsc: true,
};

/** Empty staged state used by erase — bare query with no limit. */
export const EMPTY_STAGED: SearchState = {
  query: EMPTY_QUERY,
  sort: DEFAULT_SORT,
};

/** Default staged state for new entries — includes limit 256. */
export const DEFAULT_STAGED: SearchState = {
  query: DEFAULT_QUERY,
  sort: DEFAULT_SORT,
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
export const DEFAULT_SEARCH_KEY = "draft";
