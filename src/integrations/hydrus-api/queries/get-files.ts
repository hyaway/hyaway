import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getFileMetadata } from "../api-client";
import { useSessionKeyHash } from "../hydrus-config-store";

export const useGetSingleFileMetadata = (fileId: number) => {
  const sessionKeyHash = useSessionKeyHash();

  return useQuery({
    queryKey: ["getSingleFileMetadata", fileId, sessionKeyHash],
    queryFn: async () => {
      const response = await getFileMetadata([fileId], false);
      if (response.metadata.length === 0) {
        throw new Error("File not found.");
      }
      return response.metadata[0];
    },
    enabled: !!sessionKeyHash && !!fileId,
    staleTime: Infinity,
  });
};

export const useGetFilesMetadata = (
  file_ids: Array<number>,
  only_return_basic_information = true,
) => {
  const sessionKeyHash = useSessionKeyHash();

  return useQuery({
    queryKey: [
      "getFilesMetadata",
      file_ids,
      only_return_basic_information,
      sessionKeyHash,
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
    enabled: !!sessionKeyHash && file_ids.length > 0,
    staleTime: Infinity, // Should not change without user action
  });
};

export const useInfiniteGetFilesMetadata = (
  file_ids: Array<number>,
  only_return_basic_information = true,
) => {
  const sessionKeyHash = useSessionKeyHash();
  const BATCH_SIZE = 128;

  return useInfiniteQuery({
    queryKey: [
      "infiniteGetFilesMetadata",
      file_ids,
      only_return_basic_information,
      BATCH_SIZE,
      sessionKeyHash,
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
    enabled: !!sessionKeyHash && file_ids.length > 0,
    staleTime: Infinity,
  });
};
