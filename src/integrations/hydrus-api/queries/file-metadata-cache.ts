// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { QueryClient } from "@tanstack/react-query";
import type { FileMetadata } from "../models";

type BatchMetadataData = {
  metadata: Array<FileMetadata>;
};

type InfiniteMetadataData = {
  pages: Array<BatchMetadataData & { nextCursor?: number }>;
  pageParams: Array<number>;
};

/** Updates matching metadata entries and returns undefined when nothing changed. */
function updateMetadataArray(
  metadata: Array<FileMetadata>,
  fileIdSet: Set<number>,
  updater: (metadata: FileMetadata) => FileMetadata,
) {
  let nextMetadata: Array<FileMetadata> | undefined;

  for (let i = 0; i < metadata.length; i++) {
    const meta = metadata[i];
    if (fileIdSet.has(meta.file_id)) {
      const nextMeta = updater(meta);
      if (nextMeta !== meta) {
        if (!nextMetadata) nextMetadata = [...metadata];
        nextMetadata[i] = nextMeta;
      }
    }
  }

  return nextMetadata;
}

/** Creates a TanStack infinite-query updater that clones only changed pages. */
function infiniteUpdater(
  fileIdSet: Set<number>,
  updater: (metadata: FileMetadata) => FileMetadata,
) {
  return (oldData: InfiniteMetadataData | undefined) => {
    if (!oldData) return oldData;
    let batches: typeof oldData.pages | undefined;
    for (let i = 0; i < oldData.pages.length; i++) {
      const batch = oldData.pages[i];
      const metadata = updateMetadataArray(batch.metadata, fileIdSet, updater);
      if (metadata) {
        if (!batches) batches = [...oldData.pages];
        batches[i] = { ...batch, metadata };
      }
    }
    return batches ? { ...oldData, pages: batches } : oldData;
  };
}

function updateSingleFileMetadataCaches(
  queryClient: QueryClient,
  fileIds: Array<number>,
  updater: (metadata: FileMetadata) => FileMetadata,
) {
  for (const fileId of fileIds) {
    queryClient.setQueriesData<FileMetadata>(
      {
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "getSingleFileMetadata" && key[1] === fileId;
        },
      },
      (oldData) => (oldData ? updater(oldData) : oldData),
    );
  }
}

function updateBatchFileMetadataCaches(
  queryClient: QueryClient,
  fileIdSet: Set<number>,
  updater: (metadata: FileMetadata) => FileMetadata,
) {
  queryClient.setQueriesData<BatchMetadataData>(
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
      const metadata = updateMetadataArray(
        oldData.metadata,
        fileIdSet,
        updater,
      );
      return metadata ? { ...oldData, metadata } : oldData;
    },
  );
}

function updateInfiniteFileMetadataCaches(
  queryClient: QueryClient,
  fileIdSet: Set<number>,
  updater: (metadata: FileMetadata) => FileMetadata,
) {
  queryClient.setQueriesData<InfiniteMetadataData>(
    {
      predicate: (query) =>
        query.queryKey[0] === "infiniteGetFilesMetadata" &&
        (query.isActive() || !query.isStale()),
    },
    infiniteUpdater(fileIdSet, updater),
  );
}

/**
 * Applies metadata changes across all cache shapes that can hold FileMetadata.
 * Updaters should return the original object when no fields changed.
 */
export function updateFileMetadataCaches(
  queryClient: QueryClient,
  fileIds: Array<number> | undefined,
  updater: (metadata: FileMetadata) => FileMetadata,
) {
  if (!fileIds?.length) return;

  const fileIdSet = new Set(fileIds);

  updateSingleFileMetadataCaches(queryClient, fileIds, updater);
  updateBatchFileMetadataCaches(queryClient, fileIdSet, updater);
  updateInfiniteFileMetadataCaches(queryClient, fileIdSet, updater);
}
