import axios from "axios";
import z from "zod";
import memoize from "lodash.memoize";
import * as batshit from "@yornaath/batshit";
import { useQuery } from "@tanstack/react-query";
import { useApiAccessKey, useApiEndpoint } from "./hydrus-config-store";
import { BaseResponseSchema, HYDRUS_API_HEADER_ACCESS_KEY } from "./hydrus-api";
import { simpleHash } from "@/lib/utils";

const FileMetadataSchema = z.object({
  file_id: z.number(),
  hash: z.string(),
  mime: z.string(),
  width: z.number(),
  height: z.number(),
  duration: z.number().nullable(),
  file_size: z.number(),
  import_time: z.number(),
  last_viewed_time: z.number(),
  has_audio: z.boolean(),
  num_frames: z.number().nullable(),
  framerate: z.number().nullable(),
  is_new: z.boolean(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

const GetFileMetadataResponseSchema = BaseResponseSchema.extend({
  metadata: z.array(FileMetadataSchema),
});

export type GetFileMetadataResponse = z.infer<
  typeof GetFileMetadataResponseSchema
>;

export async function getFileMetadata(
  apiEndpoint: string,
  apiAccessKey: string,
  fileIds?: Array<string>,
): Promise<Array<FileMetadata>> {
  const response = await axios.get<{ metadata: Array<FileMetadata> }>(
    `${apiEndpoint}/get_files/file_metadata`,
    {
      headers: {
        [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
      },
      params: {
        file_ids: fileIds?.join(","),
      },
    },
  );
  return response.data.metadata;
}

const getFileMetadataBatcher = memoize(
  (apiEndpoint: string, apiAccessKey: string) => {
    return batshit.create({
      name: "HydrusGetFileMetadataBatcher",
      fetcher: async (file_ids: Array<string>) =>
        await getFileMetadata(apiEndpoint, apiAccessKey, file_ids),
      scheduler: batshit.windowedFiniteBatchScheduler({
        windowMs: 50,
        maxBatchSize: 128,
      }),
      resolver: batshit.keyResolver("file_id"),
    });
  },
);

export const useGetFileMetadata = (file_id: string) => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: ["getFileMetadata", apiEndpoint, simpleHash(apiAccessKey)],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey) {
        throw new Error("API endpoint and access key are required.");
      }
      if (!file_id) {
        throw new Error("File Id is required.");
      }
      return getFileMetadataBatcher(apiEndpoint, apiAccessKey).fetch(file_id);
    },
    enabled: (!!apiEndpoint && !!apiAccessKey) || !!file_id,
    staleTime: Infinity, // Should not change without user action
  });
};
