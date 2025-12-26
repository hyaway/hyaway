import axios from "axios";
import {
  BaseResponseSchema,
  GetClientOptionsResponseSchema,
  GetFileMetadataResponseSchema,
  GetPageInfoResponseSchema,
  GetPagesResponseSchema,
  GetServicesResponseSchema,
  HYDRUS_API_HEADER_ACCESS_KEY,
  HYDRUS_API_HEADER_SESSION_KEY,
  RequestNewPermissionsResponseSchema,
  SearchFilesResponseSchema,
  SessionKeyResponseSchema,
  VerifyAccessKeyResponseSchema,
} from "./models";
import { useAuthStore } from "./hydrus-config-store";
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
  SessionKeyResponse,
  VerifyAccessKeyResponse,
} from "./models";

// #region Session Management
/**
 * In-flight session refresh promise (single-flight pattern)
 */
let refreshSessionPromise: Promise<SessionKeyResponse> | undefined;

/**
 * Fetches a new session key from the API.
 */
async function fetchSessionKey(): Promise<SessionKeyResponse> {
  const { api_endpoint, api_access_key, actions } = useAuthStore.getState();

  try {
    const response = await axios.get(`${api_endpoint}/session_key`, {
      headers: { [HYDRUS_API_HEADER_ACCESS_KEY]: api_access_key },
    });
    const parsed = SessionKeyResponseSchema.parse(response.data);
    actions.setSessionKey(parsed.session_key);
    return parsed;
  } finally {
    refreshSessionPromise = undefined;
  }
}

/**
 * Ensures a session key is available (lazy initialization).
 * Returns immediately if a valid session key exists, otherwise fetches one.
 * Uses single-flight pattern to prevent redundant network requests.
 */
async function ensureSessionKey(): Promise<string> {
  const { sessionKey } = useAuthStore.getState();
  if (sessionKey) return sessionKey;

  // Reuse in-flight request if one exists, otherwise start a new one
  if (!refreshSessionPromise) {
    refreshSessionPromise = fetchSessionKey();
  }
  const response = await refreshSessionPromise;
  return response.session_key;
}

/**
 * Force refresh the session key, clearing any cached value.
 */
export async function refreshSessionKey(): Promise<SessionKeyResponse> {
  const { actions } = useAuthStore.getState();
  actions.setSessionKey(undefined);

  if (!refreshSessionPromise) {
    refreshSessionPromise = fetchSessionKey();
  }
  return refreshSessionPromise;
}
// #endregion Session Management

// #region Axios Instance
/**
 * Configured axios instance that reads from Zustand store.
 * Automatically injects the appropriate auth key via interceptors.
 */
const apiClient = axios.create();

// Request interceptor: inject auth key (session or access based on setting)
apiClient.interceptors.request.use(async (config) => {
  const { api_endpoint, api_access_key, useSessionKey } =
    useAuthStore.getState();

  if (!api_endpoint) {
    throw new Error("Hydrus API endpoint is not configured.");
  }

  // Set base URL from store
  config.baseURL = api_endpoint;

  if (useSessionKey) {
    // Acquire session key lazily (will return cached key if available)
    const sessionKey = await ensureSessionKey();
    config.headers[HYDRUS_API_HEADER_SESSION_KEY] = sessionKey;

    // Remove access key header if present (session key takes precedence)
    if (HYDRUS_API_HEADER_ACCESS_KEY in config.headers) {
      delete config.headers[HYDRUS_API_HEADER_ACCESS_KEY];
    }
  } else {
    // Use access key directly
    config.headers[HYDRUS_API_HEADER_ACCESS_KEY] = api_access_key;

    // Remove session key header if present
    if (HYDRUS_API_HEADER_SESSION_KEY in config.headers) {
      delete config.headers[HYDRUS_API_HEADER_SESSION_KEY];
    }
  }

  return config;
});

// Response interceptor: handle session expiry and auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config;
    const { useSessionKey } = useAuthStore.getState();

    // Session expired (HTTP 419) - refresh and retry once (only when using session key)
    if (
      useSessionKey &&
      status === 419 &&
      originalRequest &&
      !originalRequest.__retried
    ) {
      originalRequest.__retried = true;
      try {
        const { session_key } = await refreshSessionKey();
        originalRequest.headers[HYDRUS_API_HEADER_SESSION_KEY] = session_key;
        return apiClient(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    // Forbidden (HTTP 403) - clear session state (only when using session key)
    if (useSessionKey && status === 403) {
      console.error(
        "Hydrus API access forbidden: please check your access key permissions.",
      );
      const { actions } = useAuthStore.getState();
      actions.setSessionKey(undefined);
      refreshSessionPromise = undefined;
    }

    return Promise.reject(error);
  },
);
// #endregion Axios Instance

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
  const { api_endpoint, api_access_key } = useAuthStore.getState();
  const headers: Record<string, string> = {};

  if (keyType === "persistent") {
    headers[HYDRUS_API_HEADER_ACCESS_KEY] = api_access_key;
  } else {
    const sessionKey = await ensureSessionKey();
    headers[HYDRUS_API_HEADER_SESSION_KEY] = sessionKey;
  }

  const response = await axios.get(`${api_endpoint}/verify_access_key`, {
    headers,
  });
  return VerifyAccessKeyResponseSchema.parse(response.data);
}

/**
 * Get all services configured in Hydrus
 */
export async function getServices(): Promise<GetServicesResponse> {
  const response = await apiClient.get("/get_services");
  return GetServicesResponseSchema.parse(response.data);
}

/**
 * Search for files matching the given criteria
 */
export async function searchFiles(
  options: SearchFilesOptions,
): Promise<SearchFilesResponse> {
  const { tags, ...rest } = options;
  const response = await apiClient.get("/get_files/search_files", {
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
  const response = await apiClient.get("/get_files/file_metadata", {
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
  const response = await apiClient.get("/manage_pages/get_pages");
  return GetPagesResponseSchema.parse(response.data);
}

/**
 * Get info for a specific page
 */
export async function getPageInfo(
  pageKey: string,
  simple = true,
): Promise<GetPageInfoResponse> {
  const response = await apiClient.get("/manage_pages/get_page_info", {
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
  await apiClient.post("/manage_pages/refresh_page", {
    page_key: pageKey,
  });
}

/**
 * Focus a page in the Hydrus client
 */
export async function focusPage(pageKey: string): Promise<void> {
  await apiClient.post("/manage_pages/focus_page", {
    page_key: pageKey,
  });
}

/**
 * Get client options from Hydrus
 */
export async function getClientOptions(): Promise<GetClientOptionsResponse> {
  const response = await apiClient.get("/manage_database/get_client_options");
  return GetClientOptionsResponseSchema.parse(response.data);
}
// #endregion API Functions
