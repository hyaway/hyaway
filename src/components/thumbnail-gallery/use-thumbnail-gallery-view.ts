// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useRef } from "react";
import { getIncrementalNamespaceSortedItems } from "./thumbnail-gallery-namespace-sort";
import type { NamespaceSortedItemsState } from "./thumbnail-gallery-namespace-sort";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import type { NamespaceSortConfig } from "@/stores/search-defaults";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";

export function getVisibleSourceFileIds(
  sourceFileIds: Array<number>,
  hiddenFileIds?: Array<number>,
) {
  if (!hiddenFileIds?.length) return sourceFileIds;

  const hiddenFileIdSet = new Set(hiddenFileIds);
  return sourceFileIds.filter((fileId) => !hiddenFileIdSet.has(fileId));
}

export function getVisibleLoadedItems(
  items: Array<FileMetadata>,
  hiddenFileIds?: Array<number>,
) {
  if (!hiddenFileIds?.length) return items;

  const hiddenFileIdSet = new Set(hiddenFileIds);
  return items.filter((item) => !hiddenFileIdSet.has(item.file_id));
}

export function getHybridSortedLoadedFileIds({
  sortedLoadedVisibleFileIds,
  remainingVisibleSourceFileIds,
}: {
  sortedLoadedVisibleFileIds: Array<number>;
  remainingVisibleSourceFileIds: Array<number>;
}) {
  return [...sortedLoadedVisibleFileIds, ...remainingVisibleSourceFileIds];
}

export function getNavigationFileIds({
  visibleFileIds,
  visibleLoadedFileIds,
  namespaceSort,
}: {
  visibleFileIds: Array<number>;
  visibleLoadedFileIds: Array<number>;
  namespaceSort?: NamespaceSortConfig;
}) {
  return namespaceSort ? visibleLoadedFileIds : visibleFileIds;
}

export function getFileIdsFromFileId(fileIds: Array<number>, fileId: number) {
  const fileIndex = fileIds.indexOf(fileId);
  return fileIndex === -1 ? [fileId] : fileIds.slice(fileIndex);
}

function useLoadedThumbnailGalleryView({
  data,
  hiddenFileIds,
  namespaceSort,
  allTagsServiceId,
}: {
  data: { pages: Array<{ metadata: Array<FileMetadata> }> } | undefined;
  hiddenFileIds?: Array<number>;
  namespaceSort?: NamespaceSortConfig;
  allTagsServiceId?: string;
}) {
  const namespaceSortStateRef = useRef<NamespaceSortedItemsState | undefined>(
    undefined,
  );
  const loaded = useMemo(
    () => (data ? data.pages.flatMap((page) => page.metadata) : []),
    [data],
  );
  const sortedLoadedResult = useMemo(() => {
    return getIncrementalNamespaceSortedItems({
      items: loaded,
      previousState: namespaceSortStateRef.current,
      namespaceSort,
      serviceKey: allTagsServiceId,
    });
  }, [loaded, namespaceSort, allTagsServiceId]);

  useEffect(() => {
    namespaceSortStateRef.current = sortedLoadedResult.state;
  }, [sortedLoadedResult.state]);

  return useMemo(() => {
    const visibleItems = getVisibleLoadedItems(
      sortedLoadedResult.items,
      hiddenFileIds,
    );

    return {
      loadedItemsCount: loaded.length,
      visibleItems,
      visibleFileIds: visibleItems.map((item) => item.file_id),
    };
  }, [loaded.length, sortedLoadedResult.items, hiddenFileIds]);
}

export function useThumbnailGalleryView({
  sourceFileIds,
  data,
  hiddenFileIds,
  namespaceSort,
}: {
  sourceFileIds: Array<number>;
  data: { pages: Array<{ metadata: Array<FileMetadata> }> } | undefined;
  hiddenFileIds?: Array<number>;
  namespaceSort?: NamespaceSortConfig;
}): ThumbnailGalleryView {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;

  // Source-order IDs drive total counts, unsorted navigation, and unloaded tails.
  const visibleFileIds = useMemo(
    () => getVisibleSourceFileIds(sourceFileIds, hiddenFileIds),
    [sourceFileIds, hiddenFileIds],
  );

  const {
    loadedItemsCount,
    visibleItems: visibleLoadedItems,
    visibleFileIds: visibleLoadedFileIds,
  } = useLoadedThumbnailGalleryView({
    data,
    hiddenFileIds,
    namespaceSort,
    allTagsServiceId,
  });
  // Namespace review uses the sorted loaded prefix plus the still-unloaded source tail.
  const reviewFileIds = useMemo(() => {
    if (!namespaceSort) return visibleFileIds;

    const remainingVisibleSourceFileIds = getVisibleSourceFileIds(
      sourceFileIds.slice(loadedItemsCount),
      hiddenFileIds,
    );

    return getHybridSortedLoadedFileIds({
      sortedLoadedVisibleFileIds: visibleLoadedFileIds,
      remainingVisibleSourceFileIds,
    });
  }, [
    namespaceSort,
    visibleFileIds,
    sourceFileIds,
    loadedItemsCount,
    hiddenFileIds,
    visibleLoadedFileIds,
  ]);
  return {
    totalItems: visibleFileIds.length,
    loadedItemsCount,
    visibleItemsCount: visibleLoadedItems.length,
    visibleFileIds,
    visibleLoadedItems,
    visibleLoadedFileIds,
    reviewFileIds,
  };
}

export type ThumbnailGalleryView = {
  totalItems: number;
  loadedItemsCount: number;
  visibleItemsCount: number;
  visibleFileIds: Array<number>;
  visibleLoadedItems: Array<FileMetadata>;
  visibleLoadedFileIds: Array<number>;
  reviewFileIds: Array<number>;
};
