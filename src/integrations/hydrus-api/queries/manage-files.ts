import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  archiveFiles,
  deleteFiles,
  getFileMetadata,
  unarchiveFiles,
  undeleteFiles,
} from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";

import type {
  DeleteFilesOptions,
  FileIdentifiers,
  UndeleteFilesOptions,
} from "../api-client";
import type { FileMetadata } from "../models";

export const useGetSingleFileMetadata = (fileId: number) => {
  const isConfigured = useIsApiConfigured();

  return useQuery({
    queryKey: ["getSingleFileMetadata", fileId],
    queryFn: async () => {
      const response = await getFileMetadata([fileId], false);
      if (response.metadata.length === 0) {
        throw new Error("File not found.");
      }
      return response.metadata[0];
    },
    enabled: isConfigured && !!fileId,
    staleTime: Infinity,
  });
};

export const useGetFilesMetadata = (
  file_ids: Array<number>,
  only_return_basic_information = true,
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
    staleTime: Infinity, // Should not change without user action
  });
};

export const useInfiniteGetFilesMetadata = (
  file_ids: Array<number>,
  only_return_basic_information = true,
) => {
  const isConfigured = useIsApiConfigured();
  const BATCH_SIZE = 128;

  return useInfiniteQuery({
    queryKey: [
      "infiniteGetFilesMetadata",
      file_ids,
      only_return_basic_information,
      BATCH_SIZE,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const batchFileIds = file_ids.slice(pageParam, pageParam + BATCH_SIZE);
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
          pageParam + batchFileIds.length < file_ids.length
            ? pageParam + BATCH_SIZE
            : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: isConfigured && file_ids.length > 0,
    staleTime: Infinity,
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

/**
 * Helper to update file metadata flags in all relevant caches
 */
const updateFileMetadataFlags = (
  queryClient: ReturnType<typeof useQueryClient>,
  fileIds: Array<number> | undefined,
  updater: (metadata: FileMetadata) => FileMetadata,
) => {
  if (!fileIds) return;

  const fileIdSet = new Set(fileIds);

  // Update single file metadata queries directly for immediate UI update
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
          fileIdSet.has(meta.file_id) ? updater(meta) : meta,
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
            fileIdSet.has(meta.file_id) ? updater(meta) : meta,
          ),
        })),
      };
    },
  );
};

/**
 * Mutation to delete files (send to trash)
 */
export const useDeleteFilesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: DeleteFilesOptions) => deleteFiles(options),
    onSuccess: (_data, variables) => {
      const fileIds = getFileIdsFromIdentifiers(variables);
      updateFileMetadataFlags(queryClient, fileIds, (meta) => ({
        ...meta,
        is_trashed: true,
        is_deleted: true,
      }));
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyTrashed"],
      });
    },
    mutationKey: ["deleteFiles"],
  });
};

/**
 * Mutation to undelete files (restore from trash)
 */
export const useUndeleteFilesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: UndeleteFilesOptions) => undeleteFiles(options),
    onSuccess: (_data, variables) => {
      const fileIds = getFileIdsFromIdentifiers(variables);
      updateFileMetadataFlags(queryClient, fileIds, (meta) => ({
        ...meta,
        is_trashed: false,
        is_deleted: false,
      }));
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyTrashed"],
      });
    },
    mutationKey: ["undeleteFiles"],
  });
};

/**
 * Mutation to archive files (remove from inbox)
 */
export const useArchiveFilesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: FileIdentifiers) => archiveFiles(options),
    onSuccess: (_data, variables) => {
      const fileIds = getFileIdsFromIdentifiers(variables);
      updateFileMetadataFlags(queryClient, fileIds, (meta) => ({
        ...meta,
        is_inbox: false,
      }));
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyArchived"],
      });
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyInboxed"],
      });
    },
    mutationKey: ["archiveFiles"],
  });
};

/**
 * Mutation to unarchive files (put back in inbox)
 */
export const useUnarchiveFilesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: FileIdentifiers) => unarchiveFiles(options),
    onSuccess: (_data, variables) => {
      const fileIds = getFileIdsFromIdentifiers(variables);
      updateFileMetadataFlags(queryClient, fileIds, (meta) => ({
        ...meta,
        is_inbox: true,
      }));
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyArchived"],
      });
      queryClient.invalidateQueries({
        queryKey: ["searchFiles", "recentlyInboxed"],
      });
    },
    mutationKey: ["unarchiveFiles"],
  });
};

// #endregion File Management Mutations
