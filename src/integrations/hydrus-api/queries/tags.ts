// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFileTags,
  getFavouriteTags,
  searchTags,
  setFavouriteTags,
} from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { Permission } from "../models";
import { useHasPermission } from "./access";
import type { AddFileTagsOptions } from "../tag-actions";

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

const emptySet: ReadonlySet<string> = new Set<string>();

/**
 * Fetch the user's favourite tags as a Set.
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
 * Convenience hook returning favourite tags as a guaranteed non-undefined Set.
 * Uses `useFavouriteTagsQuery` internally — no duplicate query.
 */
export const useFavouriteTagsLookup = (): ReadonlySet<string> => {
  const { data } = useFavouriteTagsQuery();
  return data ?? emptySet;
};

/**
 * Convenience hook for checking whether a display tag is favourited.
 * Leading search negation markers are ignored.
 */
export const useIsFavouriteTag = (displayTag: string): boolean => {
  const favourites = useFavouriteTagsLookup();
  const tag = displayTag.trim().replace(/^-+/, "");
  return tag ? favourites.has(tag) : false;
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
      const previous = queryClient.getQueryData<ReadonlySet<string>>([
        "favouriteTags",
      ]);

      queryClient.setQueryData<ReadonlySet<string>>(
        ["favouriteTags"],
        (old) => {
          if (!old) return old;
          const tags = new Set(old);
          if (params.remove) {
            for (const t of params.remove) tags.delete(t);
          }
          if (params.add) {
            for (const t of params.add) tags.add(t);
          }
          return tags;
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

/**
 * Mutation to add or remove tags on files for a local tag service.
 *
 * Requires Add Tags permission. Invalidates affected files' metadata on settle.
 */
export const useAddFileTagsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: AddFileTagsOptions) => addFileTags(options),
    onSettled: (_data, _err, variables) => {
      for (const fileId of variables.file_ids) {
        queryClient.invalidateQueries({
          queryKey: ["getSingleFileMetadata", fileId],
        });
      }
    },
    mutationKey: ["addFileTags"],
  });
};
