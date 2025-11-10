import axios from "axios";
import z from "zod";
import { useQuery } from "@tanstack/react-query";
import { useApiAccessKey, useApiEndpoint } from "./hydrus-config-store";
import { BaseResponseSchema, HYDRUS_API_HEADER_ACCESS_KEY } from "./hydrus-api";
import { simpleHash } from "@/lib/utils";

const FileMetadataSchema = z.object({
  blurhash: z.string(),
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
        only_return_basic_information: true,
        include_blurhash: true,
        include_milliseconds: false,
        include_notes: false,
        include_services_object: false,
      },
    },
  );
  return GetFileMetadataResponseSchema.parse(response.data).metadata;
}

export const useGetFilesMetadata = (file_ids: Array<number>) => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: [
      "getFilesMetadata",
      file_ids,
      apiEndpoint,
      simpleHash(apiAccessKey),
    ],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey) {
        throw new Error("API endpoint and access key are required.");
      }
      if (file_ids.length === 0) {
        throw new Error("File Ids are required.");
      }
      return getFileMetadata(apiEndpoint, apiAccessKey, file_ids);
    },
    select: (data) =>
      data.map((meta) => ({
        file_id: meta.file_id,
        width: meta.width,
        height: meta.height,
      })),
    enabled: !!apiEndpoint && !!apiAccessKey && file_ids.length > 0,
    staleTime: Infinity, // Should not change without user action
  });
};
