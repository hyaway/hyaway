// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  hasPositiveTagRule,
  queryToHydrusSearch,
} from "../-lib/query-to-hydrus-search";
import { searchFiles } from "@/integrations/hydrus-api/api-client";
import { useIsApiConfigured } from "@/integrations/hydrus-api/hydrus-config-store";
import {
  HydrusFileSortType,
  Permission,
} from "@/integrations/hydrus-api/models";
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { useCommittedSearch } from "@/stores/search-queries-store";
import { useAllowSystemOnlySearch } from "@/stores/search-settings-store";

export const committedSearchQueryKey = (entryKey: string) =>
  ["searchFiles", "searchPage", entryKey] as const;

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
  const isConfigured = useIsApiConfigured();
  const canSearch = useHasPermission(Permission.SEARCH_FOR_AND_FETCH_FILES);

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

  const result = useQuery({
    queryKey: [...committedSearchQueryKey(entryKey), searchTags, searchOptions],
    queryFn: () => searchFiles({ tags: searchTags, ...searchOptions }),
    enabled: isConfigured && canSearch && searchTags.length > 0,
  });

  // No committed query → surface as error so file detail falls back
  if (!committed) {
    return { ...result, isLoading: false, isError: true } as typeof result;
  }

  return result;
}
