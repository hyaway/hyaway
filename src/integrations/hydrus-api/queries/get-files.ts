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
import { useAuthKeyHash } from "../hydrus-config-store";

import type {
  DeleteFilesOptions,
  FileIdentifiers,
  UndeleteFilesOptions,
} from "../api-client";

export const useGetSingleFileMetadata = (fileId: number) => {
  const authKeyHash = useAuthKeyHash();

  return useQuery({
    queryKey: ["getSingleFileMetadata", fileId, authKeyHash],
    queryFn: async () => {
      const response = await getFileMetadata([fileId], false);
      if (response.metadata.length === 0) {
        throw new Error("File not found.");
      }
      return response.metadata[0];
    },
    enabled: !!authKeyHash && !!fileId,
    staleTime: Infinity,
  });
};

export const useGetFilesMetadata = (
  file_ids: Array<number>,
  only_return_basic_information = true,
) => {
  const authKeyHash = useAuthKeyHash();

  return useQuery({
    queryKey: [
      "getFilesMetadata",
      file_ids,
      only_return_basic_information,
      authKeyHash,
    ],
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
    enabled: !!authKeyHash && file_ids.length > 0,
    staleTime: Infinity, // Should not change without user action
  });
};

export const useInfiniteGetFilesMetadata = (
  file_ids: Array<number>,
  only_return_basic_information = true,
) => {
  const authKeyHash = useAuthKeyHash();
  const BATCH_SIZE = 128;

  return useInfiniteQuery({
    queryKey: [
      "infiniteGetFilesMetadata",
      file_ids,
      only_return_basic_information,
      BATCH_SIZE,
      authKeyHash,
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
    enabled: !!authKeyHash && file_ids.length > 0,
    staleTime: Infinity,
  });
};

// #region File Management Mutations

/**
 * Helper to extract file IDs from FileIdentifiers for cache invalidation
 */
const getFileIdsFromIdentifiers = (
  identifiers: FileIdentifiers,
): Array<number> | undefined => {
  if ("file_ids" in identifiers) return identifiers.file_ids;
  if ("file_id" in identifiers) return [identifiers.file_id];
  return undefined; // Can't invalidate by hash easily
};

/**
 * Helper to invalidate all file-related queries for given file IDs
 */
const invalidateFileQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  fileIds: Array<number> | undefined,
) => {
  if (fileIds) {
    const fileIdSet = new Set(fileIds);

    // Invalidate single file metadata queries
    for (const fileId of fileIds) {
      queryClient.invalidateQueries({
        queryKey: ["getSingleFileMetadata", fileId],
      });
    }

    // Invalidate batch metadata queries that contain any of the affected file IDs
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        if (
          key[0] !== "getFilesMetadata" &&
          key[0] !== "infiniteGetFilesMetadata"
        ) {
          return false;
        }
        // key[1] is the file_ids array
        const queryFileIds = key[1] as Array<number> | undefined;
        if (!queryFileIds) return false;
        return queryFileIds.some((id) => fileIdSet.has(id));
      },
    });
  }
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
      invalidateFileQueries(queryClient, fileIds);
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
      invalidateFileQueries(queryClient, fileIds);
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
      invalidateFileQueries(queryClient, fileIds);
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
      invalidateFileQueries(queryClient, fileIds);
    },
    mutationKey: ["unarchiveFiles"],
  });
};

// #endregion File Management Mutations
