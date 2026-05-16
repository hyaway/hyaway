// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setRating } from "../api-client";
import { updateFileMetadataCaches } from "./file-metadata-cache";
import type { FileMetadata, RatingValue, SetRatingOptions } from "../models";

/** Returns the original metadata object when the rating is already current. */
const updateRating = (
  meta: FileMetadata,
  serviceKey: string,
  rating: RatingValue,
) => {
  if (meta.ratings?.[serviceKey] === rating) return meta;

  return {
    ...meta,
    ratings: {
      ...(meta.ratings ?? {}),
      [serviceKey]: rating,
    },
  };
};

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

  updateFileMetadataCaches(queryClient, fileIds, (meta) =>
    updateRating(meta, serviceKey, rating),
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
