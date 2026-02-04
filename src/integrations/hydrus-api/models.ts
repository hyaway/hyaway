// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

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
// #endregion Access

// #region Services

// -----------------------------------------------------------------------------
// Base Schemas
// -----------------------------------------------------------------------------

/**
 * Base fields shared by all service types.
 */
const BaseServiceInfoSchema = z.object({
  name: z.string(),
  type_pretty: z.string(),
});

// -----------------------------------------------------------------------------
// Basic (Non-Rating) Services
// -----------------------------------------------------------------------------

/** All non-rating service types */
const BASIC_SERVICE_TYPES = [
  ServiceType.TAG_REPOSITORY,
  ServiceType.FILE_REPOSITORY,
  ServiceType.LOCAL_FILE_DOMAIN,
  ServiceType.LOCAL_TAG_DOMAIN,
  ServiceType.ALL_KNOWN_TAGS,
  ServiceType.ALL_KNOWN_FILES,
  ServiceType.LOCAL_BOORU,
  ServiceType.IPFS,
  ServiceType.TRASH,
  ServiceType.LOCAL_FILE_STORAGE,
  ServiceType.FILE_NOTES,
  ServiceType.CLIENT_API,
  ServiceType.DELETED_FROM_ANYWHERE,
  ServiceType.LOCAL_UPDATES,
  ServiceType.ALL_MY_FILES,
  ServiceType.SERVER_ADMIN,
] as const;

/** Helper to create a basic (non-rating) service schema for a specific type */
const basicService = <T extends ServiceType>(serviceType: T) =>
  BaseServiceInfoSchema.extend({ type: z.literal(serviceType) });

// -----------------------------------------------------------------------------
// Rating Services
// -----------------------------------------------------------------------------

/**
 * Base fields shared by all rating service types.
 */
const BaseRatingServiceInfoSchema = BaseServiceInfoSchema.extend({
  show_in_thumbnail: z.boolean().optional(),
  show_in_thumbnail_even_when_null: z.boolean().optional(),
});

/**
 * Color configuration for a rating state.
 * `brush` is the fill color, `pen` is the stroke/outline color.
 */
export const RatingColourSchema = z.object({
  brush: z.string(),
  pen: z.string(),
});

export type RatingColour = z.infer<typeof RatingColourSchema>;

/**
 * Known star shapes for rating services.
 * "svg" means a custom user SVG that can be fetched with /get_service_rating_svg.
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#services_object
 */
export const STAR_SHAPES = [
  "circle",
  "square",
  "fat star",
  "pentagram star",
  "six point star",
  "eight point star",
  "x shape",
  "square cross",
  "triangle up",
  "triangle down",
  "triangle right",
  "triangle left",
  "diamond",
  "rhombus right",
  "rhombus left",
  "hourglass",
  "pentagon",
  "hexagon",
  "small hexagon",
  "heart",
  "teardrop",
  "crescent moon",
  "svg",
] as const;

export type StarShape = (typeof STAR_SHAPES)[number];

// --- Like/Dislike Rating Service ---

/**
 * Like/Dislike rating service (type 7).
 * Has on/off status: `true` (like), `false` (dislike), `null` (unset).
 */
export const LikeRatingServiceInfoSchema = BaseRatingServiceInfoSchema.extend({
  type: z.literal(ServiceType.RATING_LIKE),
  star_shape: z.enum(STAR_SHAPES).optional().catch(undefined),
  colours: z
    .object({
      like: RatingColourSchema.optional(),
      dislike: RatingColourSchema.optional(),
      mixed: RatingColourSchema.optional(),
      null: RatingColourSchema.optional(),
    })
    .optional(),
});

export type LikeRatingServiceInfo = z.infer<typeof LikeRatingServiceInfoSchema>;

// --- Numerical Rating Service ---

/**
 * Numerical rating service (type 6).
 * Has a range of stars from `min_stars` to `max_stars`.
 */
export const NumericalRatingServiceInfoSchema =
  BaseRatingServiceInfoSchema.extend({
    type: z.literal(ServiceType.RATING_NUMERICAL),
    star_shape: z.enum(STAR_SHAPES).optional().catch(undefined),
    min_stars: z.number().optional(),
    max_stars: z.number().optional(),
    allows_zero: z.boolean().optional(),
    colours: z
      .object({
        like: RatingColourSchema.optional(),
        dislike: RatingColourSchema.optional(),
        mixed: RatingColourSchema.optional(),
        null: RatingColourSchema.optional(),
      })
      .optional(),
  });

export type NumericalRatingServiceInfo = z.infer<
  typeof NumericalRatingServiceInfoSchema
>;

// --- Inc/Dec Rating Service ---

/**
 * Inc/Dec rating service (type 22).
 * Has a positive integer rating, 0 is the minimum/default.
 */
export const IncDecRatingServiceInfoSchema = BaseRatingServiceInfoSchema.extend(
  {
    type: z.literal(ServiceType.RATING_INC_DEC),
    colours: z
      .object({
        like: RatingColourSchema.optional(),
        mixed: RatingColourSchema.optional(),
      })
      .optional(),
  },
);

export type IncDecRatingServiceInfo = z.infer<
  typeof IncDecRatingServiceInfoSchema
>;

// --- Rating Service Union ---

/**
 * Union of all rating service types.
 */
export const RatingServiceInfoSchema = z.discriminatedUnion("type", [
  LikeRatingServiceInfoSchema,
  NumericalRatingServiceInfoSchema,
  IncDecRatingServiceInfoSchema,
]);

export type RatingServiceInfo = z.infer<typeof RatingServiceInfoSchema>;

// -----------------------------------------------------------------------------
// Combined Service Schema
// -----------------------------------------------------------------------------

/**
 * Union of all service types.
 * Uses discriminated union on `type` field for efficient parsing.
 */
export const ServiceInfoSchema = z.discriminatedUnion("type", [
  // Rating services
  LikeRatingServiceInfoSchema,
  NumericalRatingServiceInfoSchema,
  IncDecRatingServiceInfoSchema,
  // Basic services (non-rating)
  ...BASIC_SERVICE_TYPES.map(basicService),
]);

export type ServiceInfo = z.infer<typeof ServiceInfoSchema>;

// -----------------------------------------------------------------------------
// Type Guards
// -----------------------------------------------------------------------------

/**
 * Type guard to check if a service is a rating service.
 */
export function isRatingService(
  service: ServiceInfo,
): service is RatingServiceInfo {
  return (
    service.type === ServiceType.RATING_LIKE ||
    service.type === ServiceType.RATING_NUMERICAL ||
    service.type === ServiceType.RATING_INC_DEC
  );
}

/**
 * Type guard to check if a service is a like/dislike rating service.
 */
export function isLikeRatingService(
  service: ServiceInfo,
): service is LikeRatingServiceInfo {
  return service.type === ServiceType.RATING_LIKE;
}

/**
 * Type guard to check if a service is a numerical rating service.
 */
export function isNumericalRatingService(
  service: ServiceInfo,
): service is NumericalRatingServiceInfo {
  return service.type === ServiceType.RATING_NUMERICAL;
}

/**
 * Type guard to check if a service is an inc/dec rating service.
 */
export function isIncDecRatingService(
  service: ServiceInfo,
): service is IncDecRatingServiceInfo {
  return service.type === ServiceType.RATING_INC_DEC;
}

// -----------------------------------------------------------------------------
// API Response
// -----------------------------------------------------------------------------

export const GetServicesResponseSchema = BaseResponseSchema.extend({
  services: z.record(z.string(), ServiceInfoSchema),
});

export type GetServicesResponse = z.infer<typeof GetServicesResponseSchema>;
// #endregion Services

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

export enum TagStatus {
  CURRENT = "0",
  PENDING = "1",
  DELETED = "2",
  PETITIONED = "3",
}

/**
 * Canvas types for file viewing statistics.
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#edit_times_increment_file_viewtime
 */
export enum CanvasType {
  MEDIA_VIEWER = 0,
  PREVIEW = 1,
  MEDIA_VIEWER_DUPLICATES = 2,
  MEDIA_VIEWER_ARCHIVE_DELETE = 3,
  CLIENT_API = 4,
  DIALOG = 5,
}

export const FileViewingStatisticsSchema = z.object({
  canvas_type: z.enum(CanvasType),
  canvas_type_pretty: z.string(),
  views: z.number(),
  viewtime: z.number(),
  last_viewed_timestamp: z.number().nullable(),
});

export type FileViewingStatistics = z.infer<typeof FileViewingStatisticsSchema>;

export const FileMetadataSchema = z.object({
  blurhash: z.string().nullish(),
  duration: z.number().nullable(),
  ext: z.string(),
  file_id: z.number(),
  filetype_enum: z.number(),
  filetype_forced: z.boolean(),
  filetype_human: z.string(),
  has_audio: z.boolean().nullable(),
  hash: z.string(),
  height: z
    .number()
    .nullable()
    .transform((val) => val ?? 200),
  mime: z.string(),
  num_frames: z.number().nullable(),
  num_words: z.number().nullable(),
  size: z.number().nullable(),
  width: z
    .number()
    .nullable()
    .transform((val) => val ?? 200),
  thumbnail_height: z.number().optional(),
  thumbnail_width: z.number().optional(),
  is_inbox: z.boolean().optional(),
  is_local: z.boolean().optional(),
  is_trashed: z.boolean().optional(),
  is_deleted: z.boolean().optional(),
  tags: z
    .record(
      z.string(),
      z.object({
        display_tags: z.record(
          z.enum(TagStatus),
          z.array(z.string()).optional(),
        ),
      }),
    )
    .optional(),
  /**
   * Ratings keyed by rating service key.
   * - Like/Dislike: `null` (unset), `true` (like), `false` (dislike)
   * - Numerical: `null` (unset), or integer (number of stars)
   * - Inc/Dec: integer (0 is minimum/default)
   */
  ratings: z
    .record(z.string(), z.boolean().or(z.number()).nullable())
    .optional(),
  file_viewing_statistics: z.array(FileViewingStatisticsSchema).optional(),
  notes: z.record(z.string(), z.string()).optional(),
  known_urls: z.array(z.string()).optional(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

export const GetFileMetadataResponseSchema = BaseResponseSchema.extend({
  metadata: z.array(FileMetadataSchema),
});

export type GetFileMetadataResponse = z.infer<
  typeof GetFileMetadataResponseSchema
>;
// #endregion Search

// #region Ratings
/**
 * Rating value for set_rating endpoint.
 * - Like/Dislike: `true` (like), `false` (dislike), `null` (unset)
 * - Numerical: integer (number of stars), `null` (unset)
 * - Inc/Dec: integer (0 is minimum)
 */
export type RatingValue = boolean | number | null;

export type SetRatingOptions = {
  /** File identifier (use one of file_id, file_ids, hash, or hashes) */
  file_id?: number;
  file_ids?: Array<number>;
  hash?: string;
  hashes?: Array<string>;
  /** Hex service key for the rating service */
  rating_service_key: string;
  /** The rating value to set */
  rating: RatingValue;
};
// #endregion Ratings

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

/**
 * Extended Page type used in the UI with computed fields.
 * - `id`: Alias for `page_key` for convenience
 * - `slug`: URL-friendly identifier (name + truncated page_key suffix)
 */
export type MediaPage = Page & {
  /** Same as page_key */
  id: string;
  /** URL-friendly slug like "my-search-abc12345" */
  slug: string;
};

// #endregion Pages

// #region Database
export const GetClientOptionsResponseSchema = BaseResponseSchema.extend({
  old_options: z
    .object({
      thumbnail_dimensions: z.array(z.number()).min(2).max(2).optional(),
      namespace_colours: z
        .record(z.string(), z.array(z.number()).min(3).max(3))
        .optional(),
    })
    .optional(),
  options: z
    .object({
      booleans: z
        .object({
          file_viewing_statistics_active: z.boolean().optional(),
        })
        .optional(),
      noneable_integers: z
        .object({
          file_viewing_statistics_media_min_time_ms: z
            .number()
            .nullable()
            .optional(),
          file_viewing_statistics_media_max_time_ms: z
            .number()
            .nullable()
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

export type GetClientOptionsResponse = z.infer<
  typeof GetClientOptionsResponseSchema
>;
// #endregion Database
