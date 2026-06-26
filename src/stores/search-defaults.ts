// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { generateID } from "@react-querybuilder/core";
import type { RuleGroupType, RuleType } from "react-querybuilder";
import { HydrusFileSortType } from "@/integrations/hydrus-api/models";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SystemSortConfig = {
  mode?: "system";
  sortType: HydrusFileSortType;
  sortAsc: boolean;
};

export type NamespaceSortConfig = {
  mode: "namespaces";
  namespaces: Array<string>;
  sortAsc: boolean;
};

export type SortConfig = SystemSortConfig | NamespaceSortConfig;

export function isNamespaceSortConfig(
  sort: SortConfig,
): sort is NamespaceSortConfig {
  return sort.mode === "namespaces";
}

export function getSystemSortConfig(sort: SortConfig): SystemSortConfig {
  if (isNamespaceSortConfig(sort)) {
    return { sortType: HydrusFileSortType.ImportTime, sortAsc: false };
  }

  return sort;
}

function isUndesiredNamespaceCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) return false;

  return (
    codePoint <= 0x1f ||
    (codePoint >= 0x7f && codePoint <= 0x9f) ||
    codePoint === 0x200b ||
    codePoint === 0x200e ||
    codePoint === 0x200f ||
    (codePoint >= 0x202a && codePoint <= 0x202e) ||
    (codePoint >= 0x2066 && codePoint <= 0x2069) ||
    codePoint === 0xfeff ||
    (codePoint >= 0xe000 && codePoint <= 0xf8ff)
  );
}

function stripUndesiredNamespaceCharacters(value: string): string {
  return Array.from(value)
    .filter((character) => !isUndesiredNamespaceCharacter(character))
    .join("");
}

export function parseNamespaceSortValue(value: string): Array<string> {
  return value
    .split(/(?<!\\)-/)
    .map((namespace) =>
      stripUndesiredNamespaceCharacters(namespace.replaceAll("\\-", "-"))
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase(),
    )
    .filter((namespace) => namespace.length > 0 && !namespace.includes(":"));
}

export function formatNamespaceSortValue(namespaces: Array<string>): string {
  return namespaces
    .map((namespace) => namespace.replaceAll("-", "\\-"))
    .join("-");
}

export function areSortConfigsEquivalent(
  left: SortConfig,
  right: SortConfig,
): boolean {
  if (isNamespaceSortConfig(left) || isNamespaceSortConfig(right)) {
    return (
      isNamespaceSortConfig(left) &&
      isNamespaceSortConfig(right) &&
      left.sortAsc === right.sortAsc &&
      left.namespaces.length === right.namespaces.length &&
      left.namespaces.every(
        (namespace, index) => namespace === right.namespaces[index],
      )
    );
  }

  return left.sortType === right.sortType && left.sortAsc === right.sortAsc;
}

type SearchRuleBase<
  TField extends string,
  TOperator extends string,
  TValue = string,
> = {
  field: TField;
  operator: TOperator;
  value: TValue;
};

type SearchStatusRule = SearchRuleBase<
  "inbox" | "archive" | "everything",
  "is",
  boolean | string
>;

type SearchTagRule = SearchRuleBase<"tag", "=", string>;

type SearchPresenceRule = {
  field:
    | "audio"
    | "transparency"
    | "exif"
    | "icc_profile"
    | "embedded_metadata"
    | "forced_filetype"
    | "duration_presence"
    | "framerate_presence"
    | "frames_presence"
    | "tags_presence"
    | "urls_presence"
    | "notes_presence";
  operator: "has" | "has_not";
  value?: string;
};

type SearchComparisonRule = SearchRuleBase<
  | "width"
  | "height"
  | "num_pixels"
  | "filesize"
  | "num_tags"
  | "duration_value"
  | "framerate"
  | "num_urls"
  | "num_notes"
  | "num_frames"
  | "media_views"
  | "preview_views"
  | "all_views"
  | "media_viewtime"
  | "preview_viewtime"
  | "all_viewtime",
  "=" | "≠" | ">" | ">=" | "<" | "<=" | "≈",
  number | string
>;

type SearchExactComparisonRule = SearchRuleBase<
  "hash" | "file_service",
  "=" | ">" | ">=" | "<" | "<=",
  string
>;

type SearchTimeRule = SearchRuleBase<
  "import_time" | "modified_time" | "archived_time" | "last_viewed_time",
  "=" | ">" | ">=" | "<" | "<=" | "≈",
  string
>;

type SearchLimitRule = SearchRuleBase<"limit", "=", number | string>;

type SearchFiletypeRule = SearchRuleBase<
  "filetype",
  "=" | "≠",
  "image" | "video" | "animation" | "audio" | "application" | string
>;

type SearchRatioRule = SearchRuleBase<
  "ratio",
  "=" | "wider than" | "taller than" | "≈",
  string
>;

type SearchUrlRule = {
  field: "url_exact" | "url_regex" | "url_domain" | "note_name";
  operator: "has" | "has_not";
  value?: string;
};

type SearchRatingRule = SearchRuleBase<
  `rating:${string}`,
  "=" | ">" | ">=" | "<" | "<=" | "has" | "has_not",
  "liked" | "disliked" | number | string
>;

export type SearchRuleInput =
  | SearchStatusRule
  | SearchTagRule
  | SearchPresenceRule
  | SearchComparisonRule
  | SearchExactComparisonRule
  | SearchTimeRule
  | SearchLimitRule
  | SearchFiletypeRule
  | SearchRatioRule
  | SearchUrlRule
  | SearchRatingRule;

/** Query + sort pair representing a complete search state. */
export type SearchState = {
  query: RuleGroupType;
  sort: SortConfig;
  fileServiceKey: string | null;
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function createSearchRule(rule: SearchRuleInput): RuleType {
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
  /** Unix timestamp in milliseconds for when the entry was created. */
  createdAt: number;
  /** Unix timestamp in milliseconds for the most recent entry change. */
  modifiedAt: number;
  /** User-facing name. Falls back to the entry key when absent. */
  displayName?: string;
  /** Whether the search should appear in pinned search lists. */
  pinned: boolean;
};

/**
 * Default search entry key, pre-created on first use.
 */
export const DEFAULT_SEARCH_KEY = "draft";
