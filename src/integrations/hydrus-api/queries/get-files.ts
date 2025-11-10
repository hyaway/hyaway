import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useHydrusApiClient } from "../hydrus-config-store";

export const useGetFilesMetadata = (
  file_ids: Array<number>,
  only_return_basic_information = true,
) => {
  const hydrusApi = useHydrusApiClient();
  return useQuery({
    queryKey: [
      "getFilesMetadata",
      file_ids,
      only_return_basic_information,
      hydrusApi,
    ],
    queryFn: async () => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      if (file_ids.length === 0) {
        throw new Error("File Ids are required.");
      }
      return hydrusApi.getFileMetadata(file_ids, only_return_basic_information);
    },
    select: (data) =>
      data.metadata.map((meta) => ({
        file_id: meta.file_id,
        width: meta.width,
        height: meta.height,
      })),
    enabled: !!hydrusApi && file_ids.length > 0,
    staleTime: Infinity, // Should not change without user action
  });
};

export const useInfiniteGetFilesMetadata = (
  file_ids: Array<number>,
  only_return_basic_information = true,
) => {
  const hydrusApi = useHydrusApiClient();
  const BATCH_SIZE = 128;

  return useInfiniteQuery({
    queryKey: [
      "infiniteGetFilesMetadata",
      file_ids,
      only_return_basic_information,
      BATCH_SIZE,
      hydrusApi,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      const batchFileIds = file_ids.slice(pageParam, pageParam + BATCH_SIZE);
      if (batchFileIds.length === 0) {
        return { metadata: [], nextCursor: undefined };
      }
      const response = await hydrusApi.getFileMetadata(
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
    enabled: !!hydrusApi && file_ids.length > 0,
    staleTime: Infinity,
  });
};
