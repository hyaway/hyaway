// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavouriteTags, searchTags, setFavouriteTags } from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { Permission } from "../models";
import { useHasPermission } from "./access";
import type { FavouriteTagsResponse } from "../models";

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

/**
 * Fetch the user's favourite tags from the hydrus client.
 *
 * Requires Add Tags permission. Results are cached for 5 minutes.
 */
export const useFavouriteTagsQuery = () => {
  const isConfigured = useIsApiConfigured();
  const canTags = useHasPermission(Permission.EDIT_FILE_TAGS);

  return useQuery({
    queryKey: ["favouriteTags"],
    queryFn: getFavouriteTags,
    enabled: isConfigured && canTags,
    staleTime: 5 * 60_000,
  });
};

/**
 * Efficient Set-based lookup for favourite tags.
 *
 * Returns a stable `Set<string>` that is rebuilt only when the
 * underlying query data changes.
 */
export const useFavouriteTagsLookup = () => {
  const { data } = useFavouriteTagsQuery();
  return useMemo(
    () => new Set(data?.favourite_tags ?? []),
    [data?.favourite_tags],
  );
};

/**
 * Mutation to add or remove a single tag from favourites.
 *
 * Optimistically updates the cache and rolls back on error.
 */
export const useSetFavouriteTagsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setFavouriteTags,
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ["favouriteTags"] });
      const previous = queryClient.getQueryData<FavouriteTagsResponse>([
        "favouriteTags",
      ]);

      queryClient.setQueryData<FavouriteTagsResponse>(
        ["favouriteTags"],
        (old) => {
          if (!old) return old;
          let tags = [...old.favourite_tags];
          if (params.remove) {
            const removeSet = new Set(params.remove);
            tags = tags.filter((t) => !removeSet.has(t));
          }
          if (params.add) {
            const existing = new Set(tags);
            for (const t of params.add) {
              if (!existing.has(t)) tags.push(t);
            }
          }
          return { ...old, favourite_tags: tags };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["favouriteTags"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favouriteTags"] });
    },
  });
};
