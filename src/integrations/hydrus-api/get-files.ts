import axios from "axios";
import z from "zod";
import memoize from "lodash.memoize";
import * as batshit from "@yornaath/batshit";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useApiAccessKey, useApiEndpoint } from "./hydrus-config-store";
import { BaseResponseSchema, HYDRUS_API_HEADER_ACCESS_KEY } from "./hydrus-api";
import type { UseQueryResult } from "@tanstack/react-query";
import { simpleHash } from "@/lib/utils";

const FileMetadataBasicSchema = z.object({
  duration: z.number().nullable(),
  ext: z.string(),
  file_id: z.number(),
  filetype_enum: z.number(),
  filetype_forced: z.boolean(),
  filetype_human: z.string(),
  has_audio: z.boolean(),
  hash: z.string(),
  height: z.number(),
  mime: z.string(),
  num_frames: z.number().nullable(),
  num_words: z.number().nullable(),
  size: z.number(),
  width: z.number(),
});

const FileMetadataSchema = FileMetadataBasicSchema.extend({
  blurhash: z.string(),
  thumbnail_width: z.number(),
  thumbnail_height: z.number(),
  is_inbox: z.boolean(),
  is_local: z.boolean(),
  is_trashed: z.boolean(),
  is_deleted: z.boolean(),
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
  file_ids: Array<number>,
): Promise<Array<FileMetadata>> {
  const response = await axios.get<{ metadata: Array<FileMetadata> }>(
    `${apiEndpoint}/get_files/file_metadata`,
    {
      headers: {
        [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
      },
      params: {
        file_ids: JSON.stringify(file_ids),
        create_new_file_ids: false,
        detailed_url_information: false,
        only_return_basic_information: false,
        include_blurhash: true,
        include_milliseconds: false,
        include_notes: false,
        include_services_object: false,
      },
    },
  );
  return GetFileMetadataResponseSchema.parse(response.data).metadata;
}

const getFileMetadataBatcher = memoize(
  (apiEndpoint: string, apiAccessKey: string) => {
    return batshit.create({
      name: "HydrusGetFileMetadataBatcher",
      fetcher: async (file_ids: Array<number>) =>
        await getFileMetadata(apiEndpoint, apiAccessKey, file_ids),
      scheduler: batshit.windowedFiniteBatchScheduler({
        windowMs: 50,
        maxBatchSize: 128,
      }),
      resolver: batshit.keyResolver("file_id"),
    });
  },
);

export const useGetFileMetadata = (file_id: number) => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: [
      "getFileMetadata",
      file_id,
      apiEndpoint,
      simpleHash(apiAccessKey),
    ],
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

export const useGetMultipleFileMetadata = (file_ids: Array<number>) => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  const combiner = useCallback(
    (results: Array<UseQueryResult<FileMetadata | null>>) => {
      return {
        data: results
          .map((res) => res.data)
          .filter(Boolean)
          .map((meta) => ({
            file_id: meta!.file_id,
            thumbnail_width: meta!.thumbnail_width,
            thumbnail_height: meta!.thumbnail_height,
          })),
        isLoading: results.some((res) => res.isLoading),
        isFetching: results.some((res) => res.isFetching),
        isError: results.some((res) => res.isError),
      } as const;
    },
    [],
  );

  return useQueries({
    queries: file_ids.map((file_id) => ({
      queryKey: [
        "getFileMetadata",
        file_id,
        apiEndpoint,
        simpleHash(apiAccessKey),
      ],
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
    })),
    combine: combiner,
  });
};
