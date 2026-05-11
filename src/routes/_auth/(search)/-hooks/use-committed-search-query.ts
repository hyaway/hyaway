// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryToHydrusSearch } from "../-lib/query-to-hydrus-search";
import { committedSearchQueryKey } from "../-lib/search-entry-utils";
import { searchFiles } from "@/integrations/hydrus-api/api-client";
import { useIsApiConfigured } from "@/integrations/hydrus-api/hydrus-config-store";
import {
  HydrusFileSortType,
  Permission,
} from "@/integrations/hydrus-api/models";
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { useCommittedSearch } from "@/stores/search-queries-store";

export { committedSearchQueryKey };

/**
 * Fetches search results for a committed search entry from the store.
 *
 * When no committed search exists, returns `isError: true` so context
 * navigation falls back to `/file/$fileId`.
 */
export function useCommittedSearchFilesQuery(entryKey: string) {
  const committed = useCommittedSearch(entryKey);
  const isConfigured = useIsApiConfigured();
  const canSearch = useHasPermission(Permission.SEARCH_FOR_AND_FETCH_FILES);

  const searchTags = useMemo(() => {
    if (!committed) return [];
    return queryToHydrusSearch(committed.query);
  }, [committed]);

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

  // No committed query → surface as error so file detail falls back.
  // Avoid spreading `result` — it would observe every property on TanStack
  // Query's tracked proxy and cause re-renders on any status change.
  if (!committed) {
    return {
      data: undefined,
      error: null,
      isLoading: false,
      isError: true,
      isPending: false,
      isFetching: false,
      isSuccess: false,
      status: "error",
      fetchStatus: "idle",
      refetch: result.refetch,
    } as unknown as typeof result;
  }

  return result;
}
