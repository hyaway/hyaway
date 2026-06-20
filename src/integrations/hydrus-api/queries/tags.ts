// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cleanTags,
  getFavouriteTags,
  searchTags,
  setFavouriteTags,
  updateFileTags,
} from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { ContentUpdateAction, Permission, TagStatus } from "../models";
import { useHasPermission } from "./access";
import { updateFileMetadataCaches } from "./file-metadata-cache";
import type {
  FileMetadata,
  SearchTagsOptions,
  UpdateFileTagsOptions,
} from "../models";

type SearchTagsQueryOptions = Omit<SearchTagsOptions, "search">;

export const useCanEditFileTags = () =>
  useHasPermission(Permission.EDIT_FILE_TAGS);

/**
 * Search for tag autocomplete suggestions.
 *
 * Requires both Search Files and Add Tags permissions.
 * Returns tags sorted by descending count.
 */
export const useSearchTagsQuery = (
  search: string,
  options?: SearchTagsQueryOptions,
) => {
  const isConfigured = useIsApiConfigured();
  const canSearch = useHasPermission(Permission.SEARCH_FOR_AND_FETCH_FILES);
  const canTags = useCanEditFileTags();
  const trimmed = search.trim();
  const tagDisplayType = options?.tag_display_type ?? "display";
  const tagServiceKey = options?.tag_service_key;
  const fileServiceKey = options?.file_service_key;

  return useQuery({
    queryKey: [
      "searchTags",
      trimmed,
      tagDisplayType,
      tagServiceKey,
      fileServiceKey,
    ],
    queryFn: async () => {
      return searchTags({
        search: trimmed,
        tag_display_type: tagDisplayType,
        tag_service_key: tagServiceKey,
        file_service_key: fileServiceKey,
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
  const canTags = useCanEditFileTags();

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

export function getCurrentStorageTags(
  metadata: FileMetadata | undefined,
  serviceKey: string,
): ReadonlyArray<string> {
  const serviceTags = metadata?.tags?.[serviceKey];
  if (!serviceTags) return [];
  return serviceTags.storage_tags[TagStatus.CURRENT] ?? [];
}

export function getTagActionStateChange(
  metadata: FileMetadata | undefined,
  serviceKey: string,
  tag: string,
  action: ContentUpdateAction,
) {
  const currentTags = getCurrentStorageTags(metadata, serviceKey);
  const hasTag = currentTags.includes(tag);

  switch (action) {
    case ContentUpdateAction.ADD:
      return { hasTag, changed: !hasTag };
    case ContentUpdateAction.DELETE:
      return { hasTag, changed: hasTag };
    default:
      action satisfies never;
      return { hasTag, changed: false };
  }
}

export function applyStorageTagChange(
  metadata: FileMetadata,
  serviceKey: string,
  tag: string,
  action: ContentUpdateAction,
): FileMetadata {
  const { changed } = getTagActionStateChange(
    metadata,
    serviceKey,
    tag,
    action,
  );
  if (!changed) return metadata;

  const serviceTags = metadata.tags?.[serviceKey] ?? {
    display_tags: {},
    storage_tags: {},
  };
  const currentTags = serviceTags.storage_tags[TagStatus.CURRENT] ?? [];
  let nextCurrentTags: Array<string>;

  switch (action) {
    case ContentUpdateAction.ADD:
      nextCurrentTags = [...currentTags, tag];
      break;
    case ContentUpdateAction.DELETE:
      nextCurrentTags = currentTags.filter((currentTag) => currentTag !== tag);
      break;
    default:
      action satisfies never;
      return metadata;
  }

  return {
    ...metadata,
    tags: {
      ...(metadata.tags ?? {}),
      [serviceKey]: {
        ...serviceTags,
        storage_tags: {
          ...serviceTags.storage_tags,
          [TagStatus.CURRENT]: nextCurrentTags,
        },
      },
    },
  };
}

const getFileIdsFromTagOptions = (
  options: UpdateFileTagsOptions,
): Array<number> | undefined => {
  if ("file_ids" in options && options.file_ids) return options.file_ids;
  if ("file_id" in options && options.file_id) return [options.file_id];
  return undefined;
};

export const useCleanTagsMutation = () => {
  return useMutation({
    mutationFn: cleanTags,
    mutationKey: ["cleanTags"],
  });
};

export const useUpdateFileTagsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFileTags,
    onMutate: async (variables) => {
      const fileIds = getFileIdsFromTagOptions(variables);
      if (!fileIds) return;

      for (const fileId of fileIds) {
        await queryClient.cancelQueries({
          queryKey: ["getSingleFileMetadata", fileId],
        });
      }

      updateFileMetadataCaches(queryClient, fileIds, (metadata) =>
        applyStorageTagChange(
          metadata,
          variables.serviceKey,
          variables.tag,
          variables.action,
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["searchFiles"],
        refetchType: "none",
      });
    },
    onSettled: (_data, _error, variables) => {
      const fileIds = getFileIdsFromTagOptions(variables);
      for (const fileId of fileIds ?? []) {
        queryClient.invalidateQueries({
          queryKey: ["getSingleFileMetadata", fileId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["getFilesMetadata"],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["infiniteGetFilesMetadata"],
        refetchType: "none",
      });
    },
    mutationKey: ["updateFileTags"],
  });
};
