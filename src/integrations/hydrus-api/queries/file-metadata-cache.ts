// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { QueryClient } from "@tanstack/react-query";
import type {
  FileMetadata,
  GetPageInfoResponse,
  SearchFilesResponse,
} from "../models";
import type { ReviewSource } from "@/stores/review-queue-store";

type BatchMetadataData = {
  metadata: Array<FileMetadata>;
};

type InfiniteMetadataData = {
  pages: Array<BatchMetadataData & { nextCursor?: number }>;
  pageParams: Array<number>;
};

export type ViewCacheData = object & {
  hyaway?: {
    hiddenFileIds?: Array<number>;
  };
};

export function getHiddenFileIds(data: ViewCacheData | null | undefined) {
  return data?.hyaway?.hiddenFileIds ?? [];
}

export function getHiddenFileCount(data: ViewCacheData | null | undefined) {
  return getHiddenFileIds(data).length;
}

export function getVisibleFileIds(
  fileIds: Array<number>,
  data: ViewCacheData | null | undefined,
) {
  const hiddenFileIds = getHiddenFileIds(data);
  if (hiddenFileIds.length === 0) return fileIds;

  const hiddenFileIdSet = new Set(hiddenFileIds);
  return fileIds.filter((fileId) => !hiddenFileIdSet.has(fileId));
}

export function formatHiddenFileCount(hiddenFileCount: number) {
  if (hiddenFileCount <= 0) return "";
  const noun = hiddenFileCount === 1 ? "file" : "files";
  return `${hiddenFileCount} hidden ${noun}`;
}

function withAddedHiddenFileIds<T extends object>(
  data: T & ViewCacheData,
  fileIds: Array<number>,
) {
  if (fileIds.length === 0) return data;

  const hiddenFileIds = getHiddenFileIds(data);
  const hiddenFileIdsSet = new Set(hiddenFileIds);
  const fileIdsToHide: Array<number> = [];

  for (const fileId of fileIds) {
    if (hiddenFileIdsSet.has(fileId)) continue;
    hiddenFileIdsSet.add(fileId);
    fileIdsToHide.push(fileId);
  }

  if (fileIdsToHide.length === 0) return data;

  return {
    ...data,
    hyaway: {
      ...data.hyaway,
      hiddenFileIds: [...hiddenFileIds, ...fileIdsToHide],
    },
  };
}

function withoutHiddenFileIds<T extends object>(data: T & ViewCacheData) {
  const hiddenFileIds = getHiddenFileIds(data);
  if (hiddenFileIds.length === 0) return data;

  const { hiddenFileIds: _hiddenFileIds, ...nextHyawaySlice } =
    data.hyaway ?? {};
  if (Object.keys(nextHyawaySlice).length === 0) {
    const { hyaway: _hyaway, ...nextData } = data;
    return nextData;
  }

  return {
    ...data,
    hyaway: nextHyawaySlice,
  };
}

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

function queryKeyMatchesReviewSourceSearch(
  queryKey: ReadonlyArray<unknown>,
  source: ReviewSource,
) {
  switch (source.type) {
    case "searchPage":
      return (
        queryKey[0] === "searchFiles" &&
        queryKey[1] === "searchPage" &&
        queryKey[2] === source.entryKey
      );
    case "predefinedSearch":
      return queryKey[0] === "searchFiles" && queryKey[1] === source.key;
    case "remotePage":
      return false;
    default:
      source satisfies never;
      return false;
  }
}

function queryKeyMatchesReviewSourcePageInfo(
  queryKey: ReadonlyArray<unknown>,
  source: ReviewSource,
) {
  return (
    source.type === "remotePage" &&
    queryKey[0] === "getPageInfo" &&
    queryKey[1] === source.pageKey
  );
}

/**
 * Marks files as hidden in cached current views. The raw Hydrus file-id lists
 * stay intact; consumers derive visible IDs from the local hidden-file list.
 */
export function hideFileIdsInViewCaches(
  queryClient: QueryClient,
  fileIds: Array<number> | undefined,
  sourceOrSources: ReviewSource | Array<ReviewSource> | null | undefined,
) {
  if (!fileIds?.length || !sourceOrSources) return;

  const sources = Array.isArray(sourceOrSources)
    ? sourceOrSources
    : [sourceOrSources];
  if (sources.length === 0) return;

  queryClient.setQueriesData<SearchFilesResponse & ViewCacheData>(
    {
      predicate: (query) =>
        sources.some((source) =>
          queryKeyMatchesReviewSourceSearch(query.queryKey, source),
        ) &&
        (query.isActive() || !query.isStale()),
    },
    (oldData) => {
      if (!oldData?.file_ids) return oldData;
      const hiddenFileIds = fileIds.filter((fileId) =>
        oldData.file_ids?.includes(fileId),
      );
      return withAddedHiddenFileIds(oldData, hiddenFileIds);
    },
  );

  queryClient.setQueriesData<GetPageInfoResponse & ViewCacheData>(
    {
      predicate: (query) =>
        sources.some((source) =>
          queryKeyMatchesReviewSourcePageInfo(query.queryKey, source),
        ) &&
        (query.isActive() || !query.isStale()),
    },
    (oldData) => {
      const media = oldData?.page_info.media;
      if (!oldData || !media) return oldData;
      // Hydrus names this field hash_ids, but page info returns numeric file ids.
      const hiddenFileIds = fileIds.filter((fileId) =>
        media.hash_ids.includes(fileId),
      );
      return withAddedHiddenFileIds(oldData, hiddenFileIds);
    },
  );
}

export function clearHiddenFileIdsInViewCaches(
  queryClient: QueryClient,
  sourceOrSources: ReviewSource | Array<ReviewSource> | null | undefined,
) {
  if (!sourceOrSources) return;

  const sources = Array.isArray(sourceOrSources)
    ? sourceOrSources
    : [sourceOrSources];
  if (sources.length === 0) return;

  queryClient.setQueriesData<SearchFilesResponse & ViewCacheData>(
    {
      predicate: (query) =>
        sources.some((source) =>
          queryKeyMatchesReviewSourceSearch(query.queryKey, source),
        ),
    },
    (oldData) => (oldData ? withoutHiddenFileIds(oldData) : oldData),
  );

  queryClient.setQueriesData<GetPageInfoResponse & ViewCacheData>(
    {
      predicate: (query) =>
        sources.some((source) =>
          queryKeyMatchesReviewSourcePageInfo(query.queryKey, source),
        ),
    },
    (oldData) => (oldData ? withoutHiddenFileIds(oldData) : oldData),
  );
}
