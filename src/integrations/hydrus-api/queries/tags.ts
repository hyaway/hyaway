// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from "@tanstack/react-query";
import { searchTags } from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { Permission } from "../models";
import { useHasPermission } from "./access";

/**
 * Search for tag autocomplete suggestions.
 *
 * Requires both Search Files and Add Tags permissions.
 * Returns tags sorted by descending count.
 */
export const useSearchTagsQuery = (search: string) => {
  const isConfigured = useIsApiConfigured();
  const canSearch = useHasPermission(Permission.SEARCH_FOR_AND_FETCH_FILES);
  const canTags = useHasPermission(Permission.EDIT_FILE_TAGS);
  const trimmed = search.trim();

  return useQuery({
    queryKey: ["searchTags", trimmed],
    queryFn: async () => {
      return searchTags({
        search: trimmed,
        tag_display_type: "display",
      });
    },
    enabled: isConfigured && canSearch && canTags && trimmed.length >= 3,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
};
