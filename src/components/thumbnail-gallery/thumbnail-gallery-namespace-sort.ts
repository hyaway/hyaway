// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import type { NamespaceSortConfig } from "@/stores/search-defaults";
import { TagStatus } from "@/integrations/hydrus-api/models";

const NUMERIC_TAG_COLLATOR = new Intl.Collator(undefined, { numeric: true });
const EMPTY_NAMESPACE_TAGS: ReadonlyArray<string> = [];

type NamespaceSortKey = Array<ReadonlyArray<string>>;

type NamespaceSortEntry = {
  item: FileMetadata;
  sortKey: NamespaceSortKey;
  sourceIndex: number;
};

export type NamespaceSortedItemsState = {
  signature: string;
  loadedItems: Array<FileMetadata>;
  sortedEntries: Array<NamespaceSortEntry>;
};

export type NamespaceSortStrategy = "none" | "full" | "append";

export type NamespaceSortedItemsResult = {
  items: Array<FileMetadata>;
  state: NamespaceSortedItemsState | undefined;
  strategy: NamespaceSortStrategy;
};

function getNamespaceSortSignature(
  namespaceSort: NamespaceSortConfig,
  serviceKey: string,
) {
  return JSON.stringify({
    serviceKey,
    sortAsc: namespaceSort.sortAsc,
    namespaces: namespaceSort.namespaces,
  });
}

function getNamespaceSortKey(
  item: FileMetadata,
  serviceKey: string,
  namespaces: Array<string>,
) {
  const displayTags = item.tags?.[serviceKey]?.display_tags;
  const currentTags = displayTags?.[TagStatus.CURRENT] ?? [];
  const tagsByNamespace = new Map<string, Array<string>>();
  const desiredNamespaces = new Set(namespaces);

  for (const displayTag of currentTags) {
    const namespace = getDisplayTagNamespace(displayTag);
    if (!desiredNamespaces.has(namespace)) continue;

    const namespaceTags = tagsByNamespace.get(namespace);

    if (namespaceTags) {
      namespaceTags.push(displayTag);
    } else {
      tagsByNamespace.set(namespace, [displayTag]);
    }
  }

  for (const tags of tagsByNamespace.values()) {
    tags.sort(NUMERIC_TAG_COLLATOR.compare);
  }

  return namespaces.map(
    (desiredNamespace) =>
      tagsByNamespace.get(desiredNamespace) ?? EMPTY_NAMESPACE_TAGS,
  );
}

function getDisplayTagNamespace(displayTag: string) {
  const startIndex = displayTag.startsWith("-") ? 1 : 0;
  const separatorIndex = displayTag.indexOf(":", startIndex);

  return separatorIndex === -1
    ? ""
    : displayTag.slice(startIndex, separatorIndex);
}

function compareNamespaceSortKeys(
  left: NamespaceSortKey,
  right: NamespaceSortKey,
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

function compareNamespaceSortEntries(
  left: NamespaceSortEntry,
  right: NamespaceSortEntry,
  namespaceSort: NamespaceSortConfig,
) {
  const comparison = compareNamespaceSortKeys(left.sortKey, right.sortKey);

  if (comparison !== 0) {
    return namespaceSort.sortAsc ? comparison : -comparison;
  }

  return left.sourceIndex - right.sourceIndex;
}

function buildNamespaceSortEntries({
  items,
  sourceIndexOffset,
  namespaceSort,
  serviceKey,
}: {
  items: Array<FileMetadata>;
  sourceIndexOffset: number;
  namespaceSort: NamespaceSortConfig;
  serviceKey: string;
}) {
  return items.map((item, index) => ({
    item,
    sourceIndex: sourceIndexOffset + index,
    sortKey: getNamespaceSortKey(item, serviceKey, namespaceSort.namespaces),
  }));
}

function mergeSortedNamespaceSortEntries({
  left,
  right,
  namespaceSort,
}: {
  left: Array<NamespaceSortEntry>;
  right: Array<NamespaceSortEntry>;
  namespaceSort: NamespaceSortConfig;
}) {
  const merged: Array<NamespaceSortEntry> = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (
      compareNamespaceSortEntries(
        left[leftIndex],
        right[rightIndex],
        namespaceSort,
      ) <= 0
    ) {
      merged.push(left[leftIndex]);
      leftIndex++;
    } else {
      merged.push(right[rightIndex]);
      rightIndex++;
    }
  }

  return [...merged, ...left.slice(leftIndex), ...right.slice(rightIndex)];
}

function canAppendToNamespaceSortState({
  previousState,
  items,
  signature,
}: {
  previousState: NamespaceSortedItemsState | undefined;
  items: Array<FileMetadata>;
  signature: string;
}) {
  if (!previousState || previousState.signature !== signature) return false;
  if (previousState.loadedItems.length > items.length) return false;

  for (let index = 0; index < previousState.loadedItems.length; index++) {
    if (previousState.loadedItems[index] !== items[index]) return false;
  }

  return true;
}

export function getIncrementalNamespaceSortedItems({
  items,
  namespaceSort,
  serviceKey,
  previousState,
}: {
  items: Array<FileMetadata>;
  namespaceSort: NamespaceSortConfig | undefined;
  serviceKey: string | undefined;
  previousState?: NamespaceSortedItemsState;
}): NamespaceSortedItemsResult {
  if (!namespaceSort || !serviceKey || namespaceSort.namespaces.length === 0) {
    return { items, state: undefined, strategy: "none" };
  }

  const signature = getNamespaceSortSignature(namespaceSort, serviceKey);
  const canAppend = canAppendToNamespaceSortState({
    previousState,
    items,
    signature,
  });

  if (canAppend && previousState) {
    const appendItems = items.slice(previousState.loadedItems.length);
    const appendEntries = buildNamespaceSortEntries({
      items: appendItems,
      sourceIndexOffset: previousState.loadedItems.length,
      namespaceSort,
      serviceKey,
    }).sort((left, right) =>
      compareNamespaceSortEntries(left, right, namespaceSort),
    );
    const sortedEntries = mergeSortedNamespaceSortEntries({
      left: previousState.sortedEntries,
      right: appendEntries,
      namespaceSort,
    });

    return {
      items: sortedEntries.map((entry) => entry.item),
      state: { signature, loadedItems: items, sortedEntries },
      strategy: "append",
    };
  }

  const sortedEntries = buildNamespaceSortEntries({
    items,
    sourceIndexOffset: 0,
    namespaceSort,
    serviceKey,
  }).sort((left, right) =>
    compareNamespaceSortEntries(left, right, namespaceSort),
  );

  return {
    items: sortedEntries.map((entry) => entry.item),
    state: { signature, loadedItems: items, sortedEntries },
    strategy: "full",
  };
}

export function sortLoadedItemsByNamespaces(
  items: Array<FileMetadata>,
  namespaceSort: NamespaceSortConfig | undefined,
  serviceKey: string | undefined,
) {
  return getIncrementalNamespaceSortedItems({
    items,
    namespaceSort,
    serviceKey,
  }).items;
}
