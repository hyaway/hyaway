import {
  BaseResponseSchema,
  GetClientOptionsResponseSchema,
  GetFileMetadataResponseSchema,
  GetPageInfoResponseSchema,
  GetPagesResponseSchema,
  GetServicesResponseSchema,
  RequestNewPermissionsResponseSchema,
  SearchFilesResponseSchema,
  VerifyAccessKeyResponseSchema,
} from "./models";

import { baseClient } from "./clients/base-client";
import { accessKeyClient } from "./clients/access-key-client";
import {
  refreshSessionKey,
  sessionKeyClient,
} from "./clients/session-key-client";

import type {
  AccessKeyType,
  CanvasType,
  GetClientOptionsResponse,
  GetFileMetadataResponse,
  GetPageInfoResponse,
  GetPagesResponse,
  GetServicesResponse,
  Permission,
  RequestNewPermissionsResponse,
  SearchFilesOptions,
  SearchFilesResponse,
  VerifyAccessKeyResponse,
} from "./models";

export { refreshSessionKey };

// #region Static API Functions (no auth required)

/**
 * Get API version from a Hydrus endpoint.
 *
 * @permission None - This endpoint has no restricted access.
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#api_version
 */
export async function getApiVersion(signal?: AbortSignal) {
  const response = await baseClient.get(`/api_version`, { signal });
  return BaseResponseSchema.parse(response.data);
}

/**
 * Request new permissions from a Hydrus endpoint.
 * Requires the "review services" dialog to be open in Hydrus client.
 *
 * @permission None - This endpoint has no restricted access.
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#request_new_permissions
 */
export async function requestNewPermissions(
  name: string,
  permitsEverything: boolean,
  basicPermissions?: ReadonlyArray<Permission>,
): Promise<RequestNewPermissionsResponse> {
  const params = permitsEverything
    ? { name, permits_everything: true }
    : { name, basic_permissions: JSON.stringify(basicPermissions) };

  const response = await baseClient.get(`/request_new_permissions`, { params });
  return RequestNewPermissionsResponseSchema.parse(response.data);
}

// #endregion Static API Functions

// #region API Functions

/**
 * Verify access key validity and get its permissions.
 *
 * @permission None - Any access key can verify itself.
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#verify_access_key
 */
export async function verifyAccessKey(
  keyType: AccessKeyType,
  signal?: AbortSignal,
): Promise<VerifyAccessKeyResponse> {
  const client = keyType === "persistent" ? accessKeyClient : sessionKeyClient;
  const response = await client.get("/verify_access_key", { signal });
  return VerifyAccessKeyResponseSchema.parse(response.data);
}

/**
 * Get all services configured in Hydrus.
 *
 * @permission Requires at least one of: Import Files (0), Add Tags (2), Manage Pages (4), or Search Files (3).
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#get_services
 */
export async function getServices(): Promise<GetServicesResponse> {
  const response = await sessionKeyClient.get("/get_services");
  return GetServicesResponseSchema.parse(response.data);
}

/**
 * Search for files matching the given criteria.
 *
 * @permission Requires: Search Files (3)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#get_files_search_files
 */
export async function searchFiles(
  options: SearchFilesOptions,
): Promise<SearchFilesResponse> {
  const { tags, ...rest } = options;
  const response = await sessionKeyClient.get("/get_files/search_files", {
    params: {
      tags: JSON.stringify(tags),
      ...rest,
    },
  });
  return SearchFilesResponseSchema.parse(response.data);
}

/**
 * Get metadata for the specified file IDs.
 *
 * @permission Requires: Search Files (3)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#get_files_file_metadata
 */
export async function getFileMetadata(
  file_ids: Array<number>,
  only_return_basic_information = false,
): Promise<GetFileMetadataResponse> {
  const response = await sessionKeyClient.get("/get_files/file_metadata", {
    params: {
      file_ids: JSON.stringify(file_ids),
      create_new_file_ids: false,
      detailed_url_information: false,
      only_return_basic_information,
      include_blurhash: !only_return_basic_information,
      include_milliseconds: false,
      include_notes: false,
      include_services_object: false,
      include_file_viewing_statistics: !only_return_basic_information,
    },
  });
  return GetFileMetadataResponseSchema.parse(response.data);
}

/**
 * Get all pages from the Hydrus client.
 *
 * @permission Requires: Manage Pages (4)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#manage_pages_get_pages
 */
export async function getPages(): Promise<GetPagesResponse> {
  const response = await sessionKeyClient.get("/manage_pages/get_pages");
  return GetPagesResponseSchema.parse(response.data);
}

/**
 * Get info for a specific page.
 *
 * @permission Requires: Manage Pages (4)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#manage_pages_get_page_info
 */
export async function getPageInfo(
  pageKey: string,
  simple = true,
): Promise<GetPageInfoResponse> {
  const response = await sessionKeyClient.get("/manage_pages/get_page_info", {
    params: {
      page_key: pageKey,
      simple,
    },
  });
  return GetPageInfoResponseSchema.parse(response.data);
}

/**
 * Refresh a page in the Hydrus client.
 *
 * @permission Requires: Manage Pages (4)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#manage_pages_refresh_page
 */
export async function refreshPage(pageKey: string): Promise<void> {
  await sessionKeyClient.post("/manage_pages/refresh_page", {
    page_key: pageKey,
  });
}

/**
 * Focus a page in the Hydrus client.
 *
 * @permission Requires: Manage Pages (4)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#manage_pages_focus_page
 */
export async function focusPage(pageKey: string): Promise<void> {
  await sessionKeyClient.post("/manage_pages/focus_page", {
    page_key: pageKey,
  });
}

/**
 * Get client options from Hydrus.
 *
 * @permission Requires: Manage Database (6)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#manage_database_get_client_options
 */
export async function getClientOptions(): Promise<GetClientOptionsResponse> {
  const response = await sessionKeyClient.get(
    "/manage_database/get_client_options",
  );
  return GetClientOptionsResponseSchema.parse(response.data);
}

// #region File Management

export type FileIdentifiers =
  | { file_ids: Array<number> }
  | { hashes: Array<string> }
  | { hash: string }
  | { file_id: number };

export type DeleteFilesOptions = FileIdentifiers & {
  file_service_key?: string;
  reason?: string;
};

export type UndeleteFilesOptions = FileIdentifiers & {
  file_service_key?: string;
};

/**
 * Send files to the trash.
 *
 * @permission Requires: Import Files (0)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#add_files_delete_files
 */
export async function deleteFiles(options: DeleteFilesOptions): Promise<void> {
  await sessionKeyClient.post("/add_files/delete_files", options);
}

/**
 * Restore files from the trash.
 *
 * @permission Requires: Import Files (0)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#add_files_undelete_files
 */
export async function undeleteFiles(
  options: UndeleteFilesOptions,
): Promise<void> {
  await sessionKeyClient.post("/add_files/undelete_files", options);
}

/**
 * Archive files (remove from inbox).
 *
 * @permission Requires: Import Files (0)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#add_files_archive_files
 */
export async function archiveFiles(options: FileIdentifiers): Promise<void> {
  await sessionKeyClient.post("/add_files/archive_files", options);
}

/**
 * Unarchive files (put back in inbox).
 *
 * @permission Requires: Import Files (0)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#add_files_unarchive_files
 */
export async function unarchiveFiles(options: FileIdentifiers): Promise<void> {
  await sessionKeyClient.post("/add_files/unarchive_files", options);
}

// #endregion File Management

// #region File Viewing Statistics

export interface IncrementFileViewtimeOptions {
  /** File identifier (one of file_id, file_ids, hash, hashes) */
  file_id: number;
  /** The canvas type - always use CLIENT_API (4) for this app */
  canvas_type: CanvasType;
  /** Timestamp when the user started viewing the file (seconds, optional) */
  timestamp?: number;
  /** Number of views to add (default: 1) */
  views?: number;
  /** How long the user viewed the file for (seconds) */
  viewtime: number;
}

/**
 * Increment file view time in Hydrus file viewing statistics.
 * This is a fire-and-forget operation - errors are silently ignored.
 *
 * @permission Requires: Edit Times (11)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#edit_times_increment_file_viewtime
 */
export async function incrementFileViewtime(
  options: IncrementFileViewtimeOptions,
): Promise<void> {
  await sessionKeyClient.post("/edit_times/increment_file_viewtime", options);
}

// #endregion File Viewing Statistics
// #endregion API Functions
