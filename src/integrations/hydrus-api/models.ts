import z from "zod";

export const HYDRUS_API_HEADER_ACCESS_KEY = "Hydrus-Client-API-Access-Key";
export const HYDRUS_API_HEADER_SESSION_KEY = "Hydrus-Client-API-Session-Key";

export const BaseResponseSchema = z.object({
  version: z.number().int().positive(),
  hydrus_version: z.number().int().positive(),
});

// #region Access
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

export type AccessKeyType = "persistent" | "session";

export const RequestNewPermissionsResponseSchema = BaseResponseSchema.extend({
  access_key: z.string(),
});

export type RequestNewPermissionsResponse = z.infer<
  typeof RequestNewPermissionsResponseSchema
>;

export const SessionKeyResponseSchema = BaseResponseSchema.extend({
  session_key: z.string().length(64),
});

export type SessionKeyResponse = z.infer<typeof SessionKeyResponseSchema>;

export const VerifyAccessKeyResponseSchema = BaseResponseSchema.extend({
  name: z.string().optional(),
  permits_everything: z.boolean().optional(),
  basic_permissions: z.array(z.enum(Permission)),
  human_description: z.string(),
});

export type VerifyAccessKeyResponse = z.infer<
  typeof VerifyAccessKeyResponseSchema
>;

export const ServiceInfoSchema = z.object({
  name: z.string(),
  type: z.enum(ServiceType),
  type_pretty: z.string(),
});

export const GetServicesResponseSchema = BaseResponseSchema.extend({
  services: z.record(z.string(), ServiceInfoSchema),
});

export type GetServicesResponse = z.infer<typeof GetServicesResponseSchema>;
// #endregion Access

// #region File actions
// (No models currently needed)
// #endregion File actions

// #region Search
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
export type HydrusTagSearch = Array<string | Array<string>>;

export type SearchFilesOptions = {
  tags: HydrusTagSearch;
  file_service_key?: string;
  tag_service_key?: string;
  include_current_tags?: boolean;
  include_pending_tags?: boolean;
  file_sort_type?: HydrusFileSortType;
  file_sort_asc?: boolean;
  return_file_ids?: boolean;
  return_hashes?: boolean;
};

export const SearchFilesResponseSchema = BaseResponseSchema.extend({
  file_ids: z.array(z.number()).optional(),
  hashes: z.array(z.string()).optional(),
});

export type SearchFilesResponse = z.infer<typeof SearchFilesResponseSchema>;

export const FileMetadataSchema = z.object({
  blurhash: z.string().optional(),
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
  thumbnail_height: z.number().optional(),
  thumbnail_width: z.number().optional(),
  is_inbox: z.boolean().optional(),
  is_local: z.boolean().optional(),
  is_trashed: z.boolean().optional(),
  is_deleted: z.boolean().optional(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

export const GetFileMetadataResponseSchema = BaseResponseSchema.extend({
  metadata: z.array(FileMetadataSchema),
});

export type GetFileMetadataResponse = z.infer<
  typeof GetFileMetadataResponseSchema
>;
// #endregion Search

// #region Pages
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

export enum PageState {
  READY = 0,
  INITIALIZING = 1,
  SEARCHING_LOADING = 2,
  SEARCH_CANCELLED = 3,
}

export const PageBaseSchema = z.object({
  name: z.string(),
  page_key: z.string(),
  page_state: z.enum(PageState),
  page_type: z.enum(PageType),
  is_media_page: z.boolean(),
});
export type PageBase = z.infer<typeof PageBaseSchema>;

export const PageSchema: z.ZodType<Page> = z.lazy(() =>
  PageBaseSchema.extend({
    selected: z.boolean(),
    pages: z.array(PageSchema).optional(),
  }),
);
export type Page = PageBase & {
  selected: boolean;
  pages?: Array<Page>;
};

export const GetPagesResponseSchema = BaseResponseSchema.extend({
  pages: PageSchema, // Singular page at to level
});

export type GetPagesResponse = z.infer<typeof GetPagesResponseSchema>;

export const MediaSchema = z.object({
  num_files: z.number(),
  hash_ids: z.array(z.number()),
});

export const PageInfoSchema = PageBaseSchema.extend({
  media: MediaSchema,
});

export type PageInfo = z.infer<typeof PageInfoSchema>;

export const GetPageInfoResponseSchema = BaseResponseSchema.extend({
  page_info: PageInfoSchema,
});

export type GetPageInfoResponse = z.infer<typeof GetPageInfoResponseSchema>;

// #endregion Pages

// #region Database
export const GetClientOptionsResponseSchema = BaseResponseSchema.extend({
  old_options: z
    .object({
      thumbnail_dimensions: z.array(z.number()).min(2).max(2).optional(),
    })
    .optional(),
});

export type GetClientOptionsResponse = z.infer<
  typeof GetClientOptionsResponseSchema
>;
// #endregion Database
