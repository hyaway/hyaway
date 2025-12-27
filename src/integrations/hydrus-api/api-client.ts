import axios from "axios";
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
 * Get API version from a Hydrus endpoint (no auth required)
 */
export async function getApiVersion(apiEndpoint: string) {
  const response = await axios.get(`${apiEndpoint}/api_version`);
  return BaseResponseSchema.parse(response.data);
}

/**
 * Request new permissions from a Hydrus endpoint (no auth required)
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
// #endregion Static API Functions

// #region API Functions
/**
 * Verify access key validity
 */
export async function verifyAccessKey(
  keyType: AccessKeyType,
): Promise<VerifyAccessKeyResponse> {
  const client = keyType === "persistent" ? accessKeyClient : sessionKeyClient;
  const response = await client.get("/verify_access_key");
  return VerifyAccessKeyResponseSchema.parse(response.data);
}

/**
 * Get all services configured in Hydrus
 */
export async function getServices(): Promise<GetServicesResponse> {
  const response = await sessionKeyClient.get("/get_services");
  return GetServicesResponseSchema.parse(response.data);
}

/**
 * Search for files matching the given criteria
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
 * Get metadata for the specified file IDs
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
      include_blurhash: false,
      include_milliseconds: false,
      include_notes: false,
      include_services_object: false,
    },
  });
  return GetFileMetadataResponseSchema.parse(response.data);
}

/**
 * Get all pages from the Hydrus client
 */
export async function getPages(): Promise<GetPagesResponse> {
  const response = await sessionKeyClient.get("/manage_pages/get_pages");
  return GetPagesResponseSchema.parse(response.data);
}

/**
 * Get info for a specific page
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
 * Refresh a page in the Hydrus client
 */
export async function refreshPage(pageKey: string): Promise<void> {
  await sessionKeyClient.post("/manage_pages/refresh_page", {
    page_key: pageKey,
  });
}

/**
 * Focus a page in the Hydrus client
 */
export async function focusPage(pageKey: string): Promise<void> {
  await sessionKeyClient.post("/manage_pages/focus_page", {
    page_key: pageKey,
  });
}

/**
 * Get client options from Hydrus
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
 * Send files to the trash
 */
export async function deleteFiles(options: DeleteFilesOptions): Promise<void> {
  await sessionKeyClient.post("/add_files/delete_files", options);
}

/**
 * Restore files from the trash
 */
export async function undeleteFiles(
  options: UndeleteFilesOptions,
): Promise<void> {
  await sessionKeyClient.post("/add_files/undelete_files", options);
}

/**
 * Archive files (remove from inbox)
 */
export async function archiveFiles(options: FileIdentifiers): Promise<void> {
  await sessionKeyClient.post("/add_files/archive_files", options);
}

/**
 * Unarchive files (put back in inbox)
 */
export async function unarchiveFiles(options: FileIdentifiers): Promise<void> {
  await sessionKeyClient.post("/add_files/unarchive_files", options);
}

// #endregion File Management
// #endregion API Functions
