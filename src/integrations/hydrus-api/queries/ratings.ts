// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setRating } from "../api-client";
import type { FileMetadata, RatingValue, SetRatingOptions } from "../models";

/**
 * Helper to update file metadata ratings in all relevant caches
 */
const updateFileMetadataRating = (
  queryClient: ReturnType<typeof useQueryClient>,
  fileIds: Array<number> | undefined,
  serviceKey: string,
  rating: RatingValue,
) => {
  if (!fileIds) return;

  const fileIdSet = new Set(fileIds);

  const updateRating = (meta: FileMetadata): FileMetadata => ({
    ...meta,
    ratings: {
      ...(meta.ratings ?? {}),
      [serviceKey]: rating,
    },
  });

  // Update single file metadata queries directly for immediate UI update
  for (const fileId of fileIds) {
    queryClient.setQueriesData<FileMetadata>(
      {
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "getSingleFileMetadata" && key[1] === fileId;
        },
      },
      (oldData) => (oldData ? updateRating(oldData) : oldData),
    );
  }

  // Update batch metadata queries that contain any of the affected file IDs
  queryClient.setQueriesData<{ metadata: Array<FileMetadata> }>(
    {
      predicate: (query) => {
        const key = query.queryKey;
        if (key[0] !== "getFilesMetadata") return false;
        const queryFileIds = key[1] as Array<number> | undefined;
        if (!queryFileIds) return false;
        return queryFileIds.some((id) => fileIdSet.has(id));
      },
    },
    (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        metadata: oldData.metadata.map((meta) =>
          fileIdSet.has(meta.file_id) ? updateRating(meta) : meta,
        ),
      };
    },
  );

  // Update infinite query caches
  queryClient.setQueriesData<{
    pages: Array<{ metadata: Array<FileMetadata>; nextCursor?: number }>;
    pageParams: Array<number>;
  }>(
    {
      predicate: (query) => {
        const key = query.queryKey;
        if (key[0] !== "infiniteGetFilesMetadata") return false;
        const queryFileIds = key[1] as Array<number> | undefined;
        if (!queryFileIds) return false;
        return queryFileIds.some((id) => fileIdSet.has(id));
      },
    },
    (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          metadata: page.metadata.map((meta) =>
            fileIdSet.has(meta.file_id) ? updateRating(meta) : meta,
          ),
        })),
      };
    },
  );
};

/**
 * Helper to extract file IDs from SetRatingOptions for cache updates
 */
const getFileIdsFromOptions = (
  options: SetRatingOptions,
): Array<number> | undefined => {
  if ("file_ids" in options && options.file_ids) return options.file_ids;
  if ("file_id" in options && options.file_id) return [options.file_id];
  return undefined; // Can't update by hash easily
};

/**
 * Mutation to set a rating on a file
 *
 * @permission Requires: Edit Ratings (9)
 */
export const useSetRatingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: SetRatingOptions) => setRating(options),
    // Optimistic update: update cache immediately before server call
    onMutate: async (variables) => {
      const fileIds = getFileIdsFromOptions(variables);
      if (!fileIds) return;

      // Cancel any outgoing refetches to avoid overwriting optimistic update
      for (const fileId of fileIds) {
        await queryClient.cancelQueries({
          queryKey: ["getSingleFileMetadata", fileId],
        });
      }

      // Optimistically update the cache
      updateFileMetadataRating(
        queryClient,
        fileIds,
        variables.rating_service_key,
        variables.rating,
      );
    },
    // No need to update on success - already done optimistically
    // If there's an error, React Query will automatically rollback
    mutationKey: ["setRating"],
  });
};
