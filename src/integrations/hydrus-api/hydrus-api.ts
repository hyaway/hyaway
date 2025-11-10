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
 * File import status enumeration
 */
export enum FileStatus {
  NOT_IN_DATABASE = 0,
  SUCCESSFUL = 1,
  ALREADY_IN_DATABASE = 2,
  PREVIOUSLY_DELETED = 3,
  FAILED = 4,
  VETOED = 7,
}

/**
 * Tag action enumeration for tag operations
 */
export enum TagAction {
  ADD_TO_LOCAL = 0,
  DELETE_FROM_LOCAL = 1,
  PEND_TO_REPOSITORY = 2,
  RESCIND_PEND_FROM_REPOSITORY = 3,
  PETITION_FROM_REPOSITORY = 4,
  RESCIND_PETITION_FROM_REPOSITORY = 5,
}

/**
 * URL type enumeration
 */
export enum URLType {
  POST_URL = 0,
  FILE_URL = 2,
  GALLERY_URL = 3,
  WATCHABLE_URL = 4,
  UNKNOWN_URL = 5,
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
 * Star shape enumeration for rating services
 */
export enum StarShape {
  CIRCLE = "circle",
  SQUARE = "square",
  FAT_STAR = "fat star",
  PENTAGRAM_STAR = "pentagram star",
  SIX_POINT_STAR = "six point star",
  EIGHT_POINT_STAR = "eight point star",
  X_SHAPE = "x shape",
  SQUARE_CROSS = "square cross",
  TRIANGLE_UP = "triangle up",
  TRIANGLE_DOWN = "triangle down",
  TRIANGLE_RIGHT = "triangle right",
  TRIANGLE_LEFT = "triangle left",
  DIAMOND = "diamond",
  RHOMBUS_RIGHT = "rhombus right",
  RHOMBUS_LEFT = "rhombus left",
  HOURGLASS = "hourglass",
  PENTAGON = "pentagon",
  HEXAGON = "hexagon",
  SMALL_HEXAGON = "small hexagon",
  HEART = "heart",
  TEARDROP = "teardrop",
  CRESCENT_MOON = "crescent moon",
  SVG = "svg",
}

// ============================================================================
// Zod Schemas - Common Types
// ============================================================================

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

const SessionKeyResponseSchema = BaseResponseSchema.extend({
  session_key: z.string().length(64),
});

export type SessionKeyResponse = z.infer<typeof SessionKeyResponseSchema>;

// ============================================================================
// API Functions
// ============================================================================

const HYDRUS_API_HEADER_ACCESS_KEY = "Hydrus-Client-API-Access-Key";

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
