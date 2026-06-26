// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  getFileIdsFromFileId,
  getHybridSortedLoadedFileIds,
  getNavigationFileIds,
  getVisibleLoadedItems,
  getVisibleSourceFileIds,
  sortLoadedItemsByNamespaces,
} from "./use-thumbnail-gallery-view";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { TagStatus } from "@/integrations/hydrus-api/models";

const TAG_SERVICE_KEY = "616c6c206b6e6f776e2074616773";

function metadata(
  fileId: number,
  displayTags: Array<string>,
  pendingDisplayTags: Array<string> = [],
): FileMetadata {
  return {
    file_id: fileId,
    tags: {
      [TAG_SERVICE_KEY]: {
        display_tags: {
          [TagStatus.CURRENT]: displayTags,
          [TagStatus.PENDING]: pendingDisplayTags,
        },
        storage_tags: {},
      },
    },
  } as unknown as FileMetadata;
}

describe("thumbnail gallery view helpers", () => {
  it("filters source file IDs by hidden IDs", () => {
    expect(getVisibleSourceFileIds([1, 2, 3, 4], [2, 4])).toEqual([1, 3]);
  });

  it("filters loaded metadata by hidden IDs", () => {
    const items = [metadata(1, []), metadata(2, []), metadata(3, [])];

    expect(
      getVisibleLoadedItems(items, [2]).map((item) => item.file_id),
    ).toEqual([1, 3]);
  });

  it("reuses loaded metadata when there are no hidden IDs", () => {
    const items = [metadata(1, []), metadata(2, [])];

    expect(getVisibleLoadedItems(items)).toBe(items);
  });

  it("keeps sorted loaded IDs first and appends remaining visible source IDs", () => {
    expect(
      getHybridSortedLoadedFileIds({
        sortedLoadedVisibleFileIds: [3, 2],
        remainingVisibleSourceFileIds: [1, 4],
      }),
    ).toEqual([3, 2, 1, 4]);
  });

  it("does not dedupe remaining visible source IDs", () => {
    expect(
      getHybridSortedLoadedFileIds({
        sortedLoadedVisibleFileIds: [2, 1],
        remainingVisibleSourceFileIds: [3, 4],
      }),
    ).toEqual([2, 1, 3, 4]);
  });

  it("uses all visible source IDs for regular navigation", () => {
    expect(
      getNavigationFileIds({
        visibleFileIds: [1, 2, 3, 4],
        renderedFileIds: [1, 2],
      }),
    ).toEqual([1, 2, 3, 4]);
  });

  it("uses only sorted loaded visible IDs for namespace navigation", () => {
    expect(
      getNavigationFileIds({
        visibleFileIds: [1, 2, 3, 4],
        renderedFileIds: [2, 1],
        namespaceSort: {
          mode: "namespaces",
          namespaces: ["series"],
          sortAsc: true,
        },
      }),
    ).toEqual([2, 1]);
  });

  it("returns review IDs from the clicked file onward", () => {
    expect(getFileIdsFromFileId([3, 2, 1, 4], 2)).toEqual([2, 1, 4]);
  });

  it("falls back to the clicked file when it is missing from review IDs", () => {
    expect(getFileIdsFromFileId([3, 2, 1, 4], 9)).toEqual([9]);
  });

  it("sorts loaded metadata by namespace values with numeric comparison", () => {
    const sortedItems = sortLoadedItemsByNamespaces(
      [
        metadata(1, ["series:b", "page:10"]),
        metadata(2, ["series:a", "page:2"]),
        metadata(3, ["series:a", "page:12"]),
      ],
      { mode: "namespaces", namespaces: ["series", "page"], sortAsc: true },
      TAG_SERVICE_KEY,
    );

    expect(sortedItems.map((item) => item.file_id)).toEqual([2, 3, 1]);
  });

  it("ignores pending tags when sorting loaded metadata by namespace", () => {
    const sortedItems = sortLoadedItemsByNamespaces(
      [metadata(1, [], ["series:a"]), metadata(2, ["series:b"])],
      { mode: "namespaces", namespaces: ["series"], sortAsc: true },
      TAG_SERVICE_KEY,
    );

    expect(sortedItems.map((item) => item.file_id)).toEqual([1, 2]);
  });

  it("reverses namespace sort order when descending", () => {
    const sortedItems = sortLoadedItemsByNamespaces(
      [metadata(1, ["series:b"]), metadata(2, ["series:a"])],
      { mode: "namespaces", namespaces: ["series"], sortAsc: false },
      TAG_SERVICE_KEY,
    );

    expect(sortedItems.map((item) => item.file_id)).toEqual([1, 2]);
  });
});
