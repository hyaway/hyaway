// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { useRef } from "react";
import {
  archiveFiles,
  deleteFiles,
  getFileMetadata,
  setFileViewtime,
  unarchiveFiles,
  undeleteFiles,
} from "../api-client";
import { CanvasType } from "../models";
import { useIsApiConfigured } from "../hydrus-config-store";
import { updateFileMetadataCaches } from "./file-metadata-cache";

import type {
  DeleteFilesOptions,
  FileIdentifiers,
  UndeleteFilesOptions,
} from "../api-client";
import type { FileMetadata, FileViewingStatistics } from "../models";

export const useGetSingleFileMetadata = (fileId: number) => {
  const isConfigured = useIsApiConfigured();

  return useQuery({
    queryKey: ["getSingleFileMetadata", fileId],
    queryFn: async () => {
      const response = await getFileMetadata([fileId]);
      if (response.metadata.length === 0) {
        throw new Error("File not found.");
      }
      return response.metadata[0];
    },
    enabled: isConfigured && !!fileId,
    gcTime: 10 * 1000,
  });
};

export const useGetFilesMetadata = (
  file_ids: Array<number>,
  only_return_basic_information = false,
) => {
  const isConfigured = useIsApiConfigured();

  return useQuery({
    queryKey: ["getFilesMetadata", file_ids, only_return_basic_information],
    queryFn: async () => {
      if (file_ids.length === 0) {
        throw new Error("File Ids are required.");
      }
      return getFileMetadata(file_ids, only_return_basic_information);
    },
    select: (data) =>
      data.metadata.map((meta) => ({
        file_id: meta.file_id,
        width: meta.width,
        height: meta.height,
      })),
    enabled: isConfigured && file_ids.length > 0,
  });
};

/**
 * Lightweight fingerprint for an array of file IDs.
 * Avoids putting the full (potentially 100k+) array into a TanStack Query key,
 * which would force JSON.stringify / deep-compare on every render.
 */
function fileIdsFingerprint(
  ids: Array<number>,
): [length: number, first: number | undefined, last: number | undefined] {
  return [ids.length, ids[0], ids[ids.length - 1]];
}

export const useInfiniteGetFilesMetadata = (
  file_ids: Array<number>,
  only_return_basic_information = false,
) => {
  const isConfigured = useIsApiConfigured();
  const { pathname } = useLocation();
  const BATCH_SIZE = 128;

  // Keep file_ids in a ref so the queryFn always reads the latest array
  // without needing the full array in the queryKey.
  const fileIdsRef = useRef(file_ids);
  fileIdsRef.current = file_ids;

  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- file_ids accessed via ref intentionally; fingerprint covers invalidation
  return useInfiniteQuery({
    queryKey: [
      "infiniteGetFilesMetadata",
      pathname,
      fileIdsFingerprint(file_ids),
      only_return_basic_information,
      BATCH_SIZE,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const currentIds = fileIdsRef.current;
      const batchFileIds = currentIds.slice(pageParam, pageParam + BATCH_SIZE);
      if (batchFileIds.length === 0) {
        return { metadata: [], nextCursor: undefined };
      }
      const response = await getFileMetadata(
        batchFileIds,
        only_return_basic_information,
      );
      return {
        metadata: response.metadata,
        nextCursor:
          pageParam + batchFileIds.length < currentIds.length
            ? pageParam + BATCH_SIZE
            : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: isConfigured && file_ids.length > 0,
  });
};

// #region File Management Mutations

/**
 * Helper to extract file IDs from FileIdentifiers for cache updates
 */
const getFileIdsFromIdentifiers = (
  identifiers: FileIdentifiers,
): Array<number> | undefined => {
  if ("file_ids" in identifiers) return identifiers.file_ids;
  if ("file_id" in identifiers) return [identifiers.file_id];
  return undefined; // Can't update by hash easily
};

const updateMetadataFields = (
  meta: FileMetadata,
  fields: Partial<FileMetadata>,
) => {
  for (const key of Object.keys(fields) as Array<keyof FileMetadata>) {
    if (meta[key] !== fields[key]) return { ...meta, ...fields };
  }
  return meta;
};

/** Marks metadata as trashed without cloning if it is already trashed. */
const markTrashed = (meta: FileMetadata) =>
  updateMetadataFields(meta, { is_deleted: true, is_trashed: true });

/**
 * Mutation to delete files (send to trash)
 */
export const useDeleteFilesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: DeleteFilesOptions) => deleteFiles(options),
    onSuccess: (_data, variables) => {
      const fileIds = getFileIdsFromIdentifiers(variables);
      updateFileMetadataCaches(queryClient, fileIds, markTrashed);
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyTrashed"],
        refetchType: "none",
      });
    },
    mutationKey: ["deleteFiles"],
  });
};

/** Marks metadata as restored without cloning if it is already restored. */
const markUndeleted = (meta: FileMetadata) =>
  updateMetadataFields(meta, { is_deleted: false, is_trashed: false });

/**
 * Mutation to undelete files (restore from trash)
 */
export const useUndeleteFilesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: UndeleteFilesOptions) => undeleteFiles(options),
    onSuccess: (_data, variables) => {
      const fileIds = getFileIdsFromIdentifiers(variables);
      updateFileMetadataCaches(queryClient, fileIds, markUndeleted);
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyTrashed"],
        refetchType: "none",
      });
    },
    mutationKey: ["undeleteFiles"],
  });
};

/** Marks metadata as archived without cloning if it is already archived. */
const markArchived = (meta: FileMetadata) =>
  updateMetadataFields(meta, { is_inbox: false });

/**
 * Mutation to archive files (remove from inbox)
 */
export const useArchiveFilesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: FileIdentifiers) => archiveFiles(options),
    onSuccess: (_data, variables) => {
      const fileIds = getFileIdsFromIdentifiers(variables);
      updateFileMetadataCaches(queryClient, fileIds, markArchived);
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyArchived"],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyInboxed"],
        refetchType: "none",
      });
    },
    mutationKey: ["archiveFiles"],
  });
};

/** Marks metadata as inboxed without cloning if it is already inboxed. */
const markInboxed = (meta: FileMetadata) =>
  updateMetadataFields(meta, { is_inbox: true });

/**
 * Mutation to unarchive files (put back in inbox)
 */
export const useUnarchiveFilesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: FileIdentifiers) => unarchiveFiles(options),
    onSuccess: (_data, variables) => {
      const fileIds = getFileIdsFromIdentifiers(variables);
      updateFileMetadataCaches(queryClient, fileIds, markInboxed);
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyArchived"],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyInboxed"],
        refetchType: "none",
      });
    },
    mutationKey: ["unarchiveFiles"],
  });
};

// #endregion File Management Mutations

// #region File Viewing Statistics Mutations

/** Updates matching viewing stats while preserving unchanged stat references. */
const updateFileViewingStatistic = (
  meta: FileMetadata,
  updater: (stat: FileViewingStatistics) => FileViewingStatistics,
) => {
  if (!meta.file_viewing_statistics) return meta;

  let file_viewing_statistics: Array<FileViewingStatistics> | undefined;
  for (let i = 0; i < meta.file_viewing_statistics.length; i++) {
    const stat = meta.file_viewing_statistics[i];
    const nextStat = updater(stat);
    if (nextStat !== stat) {
      if (!file_viewing_statistics) {
        file_viewing_statistics = [...meta.file_viewing_statistics];
      }
      file_viewing_statistics[i] = nextStat;
    }
  }

  return file_viewing_statistics ? { ...meta, file_viewing_statistics } : meta;
};

/** Clears Client API viewtime without cloning if it is already clear. */
const clearClientApiViewtime = (meta: FileMetadata) =>
  updateFileViewingStatistic(meta, (stat) =>
    stat.canvas_type === CanvasType.CLIENT_API && stat.viewtime !== 0
      ? { ...stat, viewtime: 0 }
      : stat,
  );

interface ClearFileViewtimeParams {
  fileId: number;
  /** Current views count to preserve */
  currentViews: number;
}

/**
 * Mutation to clear file viewtime (set to 0) for the Client API canvas type
 * Preserves the current views count
 */
export const useClearFileViewtimeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, currentViews }: ClearFileViewtimeParams) =>
      setFileViewtime({
        file_id: fileId,
        canvas_type: CanvasType.CLIENT_API,
        views: currentViews,
        viewtime: 0,
      }),
    onSuccess: (_data, { fileId }) => {
      updateFileMetadataCaches(queryClient, [fileId], clearClientApiViewtime);
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "longestViewed"],
        refetchType: "none",
      });
    },
    mutationKey: ["clearFileViewtime"],
  });
};

interface ClearFileViewsParams {
  fileId: number;
  /** Current viewtime to preserve */
  currentViewtime: number;
}

/** Clears Client API views without cloning if they are already clear. */
const clearClientApiViews = (meta: FileMetadata) =>
  updateFileViewingStatistic(meta, (stat) =>
    stat.canvas_type === CanvasType.CLIENT_API && stat.views !== 0
      ? { ...stat, views: 0 }
      : stat,
  );

/**
 * Mutation to clear file views (set to 0) for the Client API canvas type
 * Preserves the current viewtime
 */
export const useClearFileViewsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, currentViewtime }: ClearFileViewsParams) =>
      setFileViewtime({
        file_id: fileId,
        canvas_type: CanvasType.CLIENT_API,
        views: 0,
        viewtime: currentViewtime,
      }),
    onSuccess: (_data, { fileId }) => {
      updateFileMetadataCaches(queryClient, [fileId], clearClientApiViews);
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "mostViewed"],
        refetchType: "none",
      });
    },
    mutationKey: ["clearFileViews"],
  });
};

// #endregion File Viewing Statistics Mutations
