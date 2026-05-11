// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { queryToHydrusSearch } from "../-components/system-predicate-builder";
import type { RuleGroupType } from "react-querybuilder";
import { HydrusFileSortType } from "@/integrations/hydrus-api/models";
import { useSearchFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { useCommittedSearch } from "@/stores/search-queries-store";
import { useAllowSystemOnlySearch } from "@/stores/search-settings-store";

/** Check if a query has at least one non-negated tag rule. */
function hasPositiveTagRule(query: RuleGroupType): boolean {
  return query.rules.some((r) => {
    if ("rules" in r) return hasPositiveTagRule(r);
    return (
      r.field === "tag" &&
      typeof r.value === "string" &&
      r.value.trim().length > 0 &&
      !r.value.trimStart().startsWith("-")
    );
  });
}

/**
 * Fetches search results for a committed search entry from the store.
 *
 * Handles system-only query gating: if the committed query has no positive
 * tag rules and system-only searches are disabled, the query won't fire.
 *
 * When no committed search exists, returns `isError: true` so context
 * navigation falls back to `/file/$fileId`.
 */
export function useCommittedSearchFilesQuery(entryKey: string) {
  const committed = useCommittedSearch(entryKey);
  const allowSystemOnly = useAllowSystemOnlySearch();

  const searchTags = useMemo(() => {
    if (!committed) return [];
    const tags = queryToHydrusSearch(committed.query);
    // Gate system-only queries
    if (
      tags.length > 0 &&
      !hasPositiveTagRule(committed.query) &&
      !allowSystemOnly
    ) {
      return [];
    }
    return tags;
  }, [committed, allowSystemOnly]);

  const searchOptions = useMemo(
    () => ({
      file_sort_type: committed?.sort.sortType ?? HydrusFileSortType.ImportTime,
      file_sort_asc: committed?.sort.sortAsc ?? true,
    }),
    [committed],
  );

  const result = useSearchFilesQuery(searchTags, searchOptions);

  // No committed query → surface as error so file detail falls back
  if (!committed) {
    return { ...result, isLoading: false, isError: true } as typeof result;
  }

  return result;
}
