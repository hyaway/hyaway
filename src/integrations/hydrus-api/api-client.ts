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
  GetClientOptionsResponse,
  GetFileMetadataResponse,
  GetPageInfoResponse,
  GetPagesResponse,
  GetServicesResponse,
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
export async function getApiVersion() {
  const response = await baseClient.get(`/api_version`);
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
): Promise<RequestNewPermissionsResponse> {
  const response = await baseClient.get(`/request_new_permissions`, {
    params: {
      name,
      permits_everything: true,
    },
  });
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
): Promise<VerifyAccessKeyResponse> {
  const client = keyType === "persistent" ? accessKeyClient : sessionKeyClient;
  const response = await client.get("/verify_access_key");
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
  only_return_basic_information = true,
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
// #endregion API Functions
