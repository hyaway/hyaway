import z from "zod";
import axios from "axios";

// ============================================================================
// Constants and Enums
// ============================================================================

/**
 * Service type enumeration
 * Maps to the various service types in Hydrus
 */
export enum ServiceType {
  TAG_REPOSITORY = 0,
  FILE_REPOSITORY = 1,
  LOCAL_FILE_DOMAIN = 2,
  LOCAL_TAG_DOMAIN = 5,
  RATING_NUMERICAL = 6,
  RATING_LIKE = 7,
  ALL_KNOWN_TAGS = 10,
  ALL_KNOWN_FILES = 11,
  LOCAL_BOORU = 12,
  IPFS = 13,
  TRASH = 14,
  LOCAL_FILE_STORAGE = 15,
  FILE_NOTES = 17,
  CLIENT_API = 18,
  DELETED_FROM_ANYWHERE = 19,
  LOCAL_UPDATES = 20,
  ALL_MY_FILES = 21,
  RATING_INC_DEC = 22,
  SERVER_ADMIN = 99,
}

/**
 * Permission enumeration
 */
export enum Permission {
  IMPORT_AND_EDIT_URLS = 0,
  IMPORT_AND_DELETE_FILES = 1,
  EDIT_FILE_TAGS = 2,
  SEARCH_FOR_AND_FETCH_FILES = 3,
  MANAGE_PAGES = 4,
  MANAGE_COOKIES_AND_HEADERS = 5,
  MANAGE_DATABASE = 6,
  EDIT_FILE_NOTES = 7,
  EDIT_FILE_RELATIONSHIPS = 8,
  EDIT_FILE_RATINGS = 9,
  MANAGE_POPUPS = 10,
  EDIT_FILE_TIMES = 11,
  COMMIT_PENDING = 12,
  SEE_LOCAL_PATHS = 13,
}

/**
 * Page type enumeration
 */
export enum PageType {
  GALLERY_DOWNLOADER = 1,
  SIMPLE_DOWNLOADER = 2,
  HARD_DRIVE_IMPORT = 3,
  PETITIONS = 5,
  FILE_SEARCH = 6,
  URL_DOWNLOADER = 7,
  DUPLICATES = 8,
  THREAD_WATCHER = 9,
  PAGE_OF_PAGES = 10,
}

/**
 * Page state enumeration
 */
export enum PageState {
  READY = 0,
  INITIALISING = 1,
  SEARCHING_LOADING = 2,
  SEARCH_CANCELLED = 3,
}

/**
 * Base response schema - all API responses include version info
 */
const BaseResponseSchema = z.object({
  version: z.number().int().positive(),
  hydrus_version: z.number().int().positive(),
});

const VerifyAccessKeyResponseSchema = BaseResponseSchema.extend({
  name: z.string().optional(),
  permits_everything: z.boolean().optional(),
  basic_permissions: z.array(z.enum(Permission)),
  human_description: z.string(),
});

export type VerifyAccessKeyResponse = z.infer<
  typeof VerifyAccessKeyResponseSchema
>;

const RequestNewPermissionsResponseSchema = z.object({
  access_key: z.string(),
});

export type RequestNewPermissionsResponse = z.infer<
  typeof RequestNewPermissionsResponseSchema
>;

const SessionKeyResponseSchema = BaseResponseSchema.extend({
  session_key: z.string().length(64),
});

export type SessionKeyResponse = z.infer<typeof SessionKeyResponseSchema>;

/**
 * Page schema - recursive structure for nested pages
 */
const PageSchema: z.ZodType<Page> = z.lazy(() =>
  z.object({
    name: z.string(),
    page_key: z.string(),
    page_state: z.enum(PageState),
    page_type: z.enum(PageType),
    is_media_page: z.boolean(),
    selected: z.boolean(),
    pages: z.array(PageSchema).optional(),
  }),
);

export type Page = {
  name: string;
  page_key: string;
  page_state: PageState;
  page_type: PageType;
  is_media_page: boolean;
  selected: boolean;
  pages?: Array<Page>;
};

const GetPagesResponseSchema = BaseResponseSchema.extend({
  pages: PageSchema, // Singular page at to level
});

export type GetPagesResponse = z.infer<typeof GetPagesResponseSchema>;

const GetClientOptionsResponseSchema = BaseResponseSchema.extend({
  old_options: z
    .object({
      thumbnail_dimensions: z.array(z.number()).min(2).max(2).optional(),
    })
    .optional(),
});

export type GetClientOptionsResponse = z.infer<
  typeof GetClientOptionsResponseSchema
>;

const MediaSchema = z.object({
  num_files: z.number(),
  hash_ids: z.array(z.number()),
});

const PageInfoSchema = z.object({
  name: z.string(),
  page_key: z.string(),
  page_state: z.enum(PageState),
  page_type: z.enum(PageType),
  is_media_page: z.boolean(),
  media: MediaSchema,
});

const GetPageInfoResponseSchema = BaseResponseSchema.extend({
  page_info: PageInfoSchema,
});

export type GetPageInfoResponse = z.infer<typeof GetPageInfoResponseSchema>;

const SearchFilesResultsSchema = BaseResponseSchema.extend({
  file_ids: z.array(z.number()).optional(),
  hashes: z.array(z.string()).optional(),
});

export type SearchFilesResults = z.infer<typeof SearchFilesResultsSchema>;

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

const ServiceInfoSchema = z.object({
  name: z.string(),
  type: z.enum(ServiceType),
  type_pretty: z.string(),
});

const GetServicesResponseSchema = BaseResponseSchema.extend({
  services: z.record(z.string(), ServiceInfoSchema),
});

export type GetServicesResponse = z.infer<typeof GetServicesResponseSchema>;

// ============================================================================
// API Functions
// ============================================================================

export const HYDRUS_API_HEADER_ACCESS_KEY = "Hydrus-Client-API-Access-Key";

/**
 * Check if your access key is valid.
 * @param apiEndpoint The base URL of the Hydrus API.
 * @param apiAccessKey The access key for authentication.
 * @returns A promise that resolves to the verification response.
 */
export async function verifyAccessKey(
  apiEndpoint: string,
  apiAccessKey: string,
): Promise<VerifyAccessKeyResponse> {
  const response = await axios.get(`${apiEndpoint}/verify_access_key`, {
    headers: {
      [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
    },
  });
  return VerifyAccessKeyResponseSchema.parse(response.data);
}

/**
 * Request a new access key with specific permissions.
 * @param apiEndpoint The base URL of the Hydrus API.
 * @param name The name for the new key.
 * @returns A promise that resolves to the new key response.
 */
export async function requestNewPermissions(
  apiEndpoint: string,
  name: string,
): Promise<RequestNewPermissionsResponse> {
  const response = await axios.get(`${apiEndpoint}/request_new_permissions`, {
    params: {
      name,
      permits_everything: true,
    },
  });
  return RequestNewPermissionsResponseSchema.parse(response.data);
}

/**
 * Get the page structure of the current UI session.
 * @param apiEndpoint The base URL of the Hydrus API.
 * @param apiAccessKey The access key for authentication.
 * @returns A promise that resolves to the pages structure.
 */
export async function getPages(
  apiEndpoint: string,
  apiAccessKey: string,
): Promise<GetPagesResponse> {
  const response = await axios.get(`${apiEndpoint}/manage_pages/get_pages`, {
    headers: {
      [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
    },
  });
  return GetPagesResponseSchema.parse(response.data);
}

/**
 * Get the current options from the client.
 * @param apiEndpoint The base URL of the Hydrus API.
 * @param apiAccessKey The access key for authentication.
 * @returns A promise that resolves to the client options.
 */
export async function getClientOptions(
  apiEndpoint: string,
  apiAccessKey: string,
): Promise<GetClientOptionsResponse> {
  const response = await axios.get(
    `${apiEndpoint}/manage_database/get_client_options`,
    {
      headers: {
        [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
      },
    },
  );
  return GetClientOptionsResponseSchema.parse(response.data);
}

/**
 * Get information about a specific page.
 * @param apiEndpoint The base URL of the Hydrus API.
 * @param apiAccessKey The access key for authentication.
 * @param pageKey The key of the page to get info for.
 * @param simple Whether to get simple info.
 * @returns A promise that resolves to the page info.
 */
export async function getPageInfo(
  apiEndpoint: string,
  apiAccessKey: string,
  pageKey: string,
  simple = true,
): Promise<GetPageInfoResponse> {
  const response = await axios.get(
    `${apiEndpoint}/manage_pages/get_page_info`,
    {
      headers: {
        [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
      },
      params: {
        page_key: pageKey,
        simple,
      },
    },
  );
  return GetPageInfoResponseSchema.parse(response.data);
}

export async function getServices(
  apiEndpoint: string,
  apiAccessKey: string,
): Promise<GetServicesResponse> {
  const response = await axios.get(`${apiEndpoint}/get_services`, {
    headers: {
      [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
    },
  });
  return GetServicesResponseSchema.parse(response.data);
}

export enum HydrusFileSortType {
  FileSize = 0,
  Duration = 1,
  ImportTime = 2,
  FileType = 3,
  Random = 4,
  Width = 5,
  Height = 6,
  Ratio = 7,
  NumberOfPixels = 8,
  NumberOfTags = 9,
  NumberOfMediaViews = 10,
  TotalMediaViewtime = 11,
  ApproximateBitrate = 12,
  HasAudio = 13,
  ModifiedTime = 14,
  Framerate = 15,
  NumberOfFrames = 16,
  LastViewedTime = 18,
  ArchiveTimestamp = 19,
  HashHex = 20,
  PixelHashHex = 21,
  Blurhash = 22,
  AverageColourLightness = 23,
  AverageColourChromaticMagnitude = 24,
  AverageColourGreenRedAxis = 25,
  AverageColourBlueYellowAxis = 26,
  AverageColourHue = 27,
}

export type HydrusTagSearch = (string | string[])[];

export interface SearchFilesOptions {
  tags: HydrusTagSearch;
  file_service_key?: string;
  tag_service_key?: string;
  include_current_tags?: boolean;
  include_pending_tags?: boolean;
  file_sort_type?: HydrusFileSortType;
  file_sort_asc?: boolean;
  return_file_ids?: boolean;
  return_hashes?: boolean;
}

export async function searchFiles(
  apiEndpoint: string,
  apiAccessKey: string,
  options: SearchFilesOptions,
) {
  const { tags, ...rest } = options;
  const response = await axios.get<SearchFilesResults>(
    `${apiEndpoint}/get_files/search_files`,
    {
      headers: {
        [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
      },
      params: {
        tags: JSON.stringify(tags),
        ...rest,
      },
    },
  );
  return response.data;
}

export async function getFileMetadata(
  apiEndpoint: string,
  apiAccessKey: string,
  fileIds?: number[],
): Promise<FileMetadata[]> {
  const response = await axios.get<{ metadata: FileMetadata[] }>(
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
