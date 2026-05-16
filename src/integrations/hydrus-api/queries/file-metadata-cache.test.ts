// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { updateFileMetadataCaches } from "./file-metadata-cache";
import type { FileMetadata } from "../models";

function createQueryClient(staleTime = Infinity) {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime, retry: false },
    },
  });
}

function metadata(fileId: number, isInbox = true): FileMetadata {
  return {
    file_id: fileId,
    is_inbox: isInbox,
  } as FileMetadata;
}

describe("updateFileMetadataCaches", () => {
  it("updates single file metadata queries", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["getSingleFileMetadata", 1], metadata(1));
    queryClient.setQueryData(["getSingleFileMetadata", 2], metadata(2));

    updateFileMetadataCaches(queryClient, [1], (meta) => ({
      ...meta,
      is_inbox: false,
    }));

    expect(
      queryClient.getQueryData<FileMetadata>(["getSingleFileMetadata", 1])
        ?.is_inbox,
    ).toBe(false);
    expect(
      queryClient.getQueryData<FileMetadata>(["getSingleFileMetadata", 2])
        ?.is_inbox,
    ).toBe(true);
  });

  it("updates matching getFilesMetadata entries without cloning unchanged query data", () => {
    const queryClient = createQueryClient();
    const unchangedMetadata = [metadata(3), metadata(4)];
    const changedMetadata = [metadata(1), metadata(2)];
    const unchangedData = { metadata: unchangedMetadata };
    const changedData = { metadata: changedMetadata };

    queryClient.setQueryData(
      ["getFilesMetadata", [3, 4], false],
      unchangedData,
    );
    queryClient.setQueryData(["getFilesMetadata", [1, 2], false], changedData);

    updateFileMetadataCaches(queryClient, [2], (meta) => ({
      ...meta,
      is_inbox: false,
    }));

    const nextUnchangedData = queryClient.getQueryData<{
      metadata: Array<FileMetadata>;
    }>(["getFilesMetadata", [3, 4], false]);
    const nextChangedData = queryClient.getQueryData<{
      metadata: Array<FileMetadata>;
    }>(["getFilesMetadata", [1, 2], false]);

    expect(nextUnchangedData).toBe(unchangedData);
    expect(nextChangedData).not.toBe(changedData);
    expect(nextChangedData?.metadata).not.toBe(changedMetadata);
    expect(nextChangedData?.metadata[0]).toBe(changedMetadata[0]);
    expect(nextChangedData?.metadata[1].is_inbox).toBe(false);
  });

  it("does not clone matching getFilesMetadata data when updater returns the same object", () => {
    const queryClient = createQueryClient();
    const cachedMetadata = [metadata(1, false), metadata(2)];
    const cachedData = { metadata: cachedMetadata };

    queryClient.setQueryData(["getFilesMetadata", [1, 2], false], cachedData);

    updateFileMetadataCaches(queryClient, [1], (meta) =>
      meta.is_inbox === false ? meta : { ...meta, is_inbox: false },
    );

    expect(queryClient.getQueryData(["getFilesMetadata", [1, 2], false])).toBe(
      cachedData,
    );
  });

  it("updates only infinite metadata pages containing affected files", () => {
    const queryClient = createQueryClient();
    const firstPage = { metadata: [metadata(1), metadata(2)], nextCursor: 2 };
    const secondPage = { metadata: [metadata(3), metadata(4)] };
    const infiniteData = {
      pages: [firstPage, secondPage],
      pageParams: [0, 2],
    };

    queryClient.setQueryData(
      ["infiniteGetFilesMetadata", "/recently-inboxed", [4, 1, 4], false, 128],
      infiniteData,
    );

    updateFileMetadataCaches(queryClient, [3], (meta) => ({
      ...meta,
      is_inbox: false,
    }));

    const nextData = queryClient.getQueryData<typeof infiniteData>([
      "infiniteGetFilesMetadata",
      "/recently-inboxed",
      [4, 1, 4],
      false,
      128,
    ]);

    expect(nextData).not.toBe(infiniteData);
    expect(nextData?.pages).not.toBe(infiniteData.pages);
    expect(nextData?.pages[0]).toBe(firstPage);
    expect(nextData?.pages[1]).not.toBe(secondPage);
    expect(nextData?.pages[1].metadata[0].is_inbox).toBe(false);
    expect(nextData?.pages[1].metadata[1]).toBe(secondPage.metadata[1]);
  });

  it("does not clone infinite metadata data when updater returns the same object", () => {
    const queryClient = createQueryClient();
    const infiniteData = {
      pages: [{ metadata: [metadata(1, false)] }],
      pageParams: [0],
    };
    const queryKey = [
      "infiniteGetFilesMetadata",
      "/recently-inboxed",
      [1, 1, 1],
      false,
      128,
    ];

    queryClient.setQueryData(queryKey, infiniteData);

    updateFileMetadataCaches(queryClient, [1], (meta) =>
      meta.is_inbox === false ? meta : { ...meta, is_inbox: false },
    );

    expect(queryClient.getQueryData(queryKey)).toBe(infiniteData);
  });

  it("does not update stale inactive infinite metadata queries", () => {
    const queryClient = createQueryClient();
    const infiniteData = {
      pages: [{ metadata: [metadata(1)] }],
      pageParams: [0],
    };
    const queryKey = [
      "infiniteGetFilesMetadata",
      "/recently-inboxed",
      [1, 1, 1],
      false,
      128,
    ];

    queryClient.setQueryData(queryKey, infiniteData);
    queryClient.invalidateQueries({ queryKey, refetchType: "none" });

    updateFileMetadataCaches(queryClient, [1], (meta) => ({
      ...meta,
      is_inbox: false,
    }));

    expect(queryClient.getQueryData(queryKey)).toBe(infiniteData);
  });
});
