// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import type { NamespaceSortConfig } from "@/stores/search-defaults";
import { TagStatus } from "@/integrations/hydrus-api/models";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { parseTag } from "@/lib/tag-utils";

const NUMERIC_TAG_COLLATOR = new Intl.Collator(undefined, { numeric: true });

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

function getNamespaceSortKey(
  item: FileMetadata,
  serviceKey: string,
  namespaces: Array<string>,
) {
  const displayTags = item.tags?.[serviceKey]?.display_tags;
  const currentTags = displayTags?.[TagStatus.CURRENT] ?? [];
  const tagsByNamespace = new Map<string, Array<string>>();

  for (const displayTag of currentTags) {
    const { namespace, tag } = parseTag(displayTag);
    const namespaceTags = tagsByNamespace.get(namespace);

    if (namespaceTags) {
      namespaceTags.push(tag);
    } else {
      tagsByNamespace.set(namespace, [tag]);
    }
  }

  for (const tags of tagsByNamespace.values()) {
    tags.sort(NUMERIC_TAG_COLLATOR.compare);
  }

  return namespaces.map(
    (desiredNamespace) => tagsByNamespace.get(desiredNamespace) ?? [],
  );
}

function compareNamespaceSortKeys(
  left: Array<Array<string>>,
  right: Array<Array<string>>,
) {
  for (let namespaceIndex = 0; namespaceIndex < left.length; namespaceIndex++) {
    const leftTags = left[namespaceIndex];
    const rightTags = right[namespaceIndex];
    const sharedTagsLength = Math.min(leftTags.length, rightTags.length);

    for (let tagIndex = 0; tagIndex < sharedTagsLength; tagIndex++) {
      const leftTag = leftTags[tagIndex];
      const rightTag = rightTags[tagIndex];

      const comparison = NUMERIC_TAG_COLLATOR.compare(leftTag, rightTag);
      if (comparison !== 0) return comparison;
    }

    if (leftTags.length !== rightTags.length) {
      return leftTags.length - rightTags.length;
    }
  }

  return 0;
}

export function sortLoadedItemsByNamespaces(
  items: Array<FileMetadata>,
  namespaceSort: NamespaceSortConfig | undefined,
  serviceKey: string | undefined,
) {
  if (!namespaceSort || !serviceKey || namespaceSort.namespaces.length === 0) {
    return items;
  }

  return items
    .map((item) => ({
      item,
      sortKey: getNamespaceSortKey(item, serviceKey, namespaceSort.namespaces),
    }))
    .sort((left, right) => {
      const comparison = compareNamespaceSortKeys(left.sortKey, right.sortKey);

      if (comparison !== 0) {
        return namespaceSort.sortAsc ? comparison : -comparison;
      }

      return 0;
    })
    .map(({ item }) => item);
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
  // Keep current loaded metadata and its IDs together for action/navigation queues.
  return useMemo(() => {
    const loaded = data ? data.pages.flatMap((page) => page.metadata) : [];
    const sortedLoaded = sortLoadedItemsByNamespaces(
      loaded,
      namespaceSort,
      allTagsServiceId,
    );
    const visibleItems = getVisibleLoadedItems(sortedLoaded, hiddenFileIds);

    return {
      loadedItemsCount: loaded.length,
      visibleItems,
      visibleFileIds: visibleItems.map((item) => item.file_id),
    };
  }, [data, namespaceSort, allTagsServiceId, hiddenFileIds]);
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
