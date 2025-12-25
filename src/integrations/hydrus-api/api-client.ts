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
import type { AxiosInstance } from "axios";

export type SessionKeyCallback = (sessionKey: string | undefined) => void;

export class HydrusApiClient {
  public readonly apiEndpoint: string;
  private readonly apiAccessKey: string;
  private readonly axiosSessionInstance: AxiosInstance;
  private sessionKey?: string;
  private refreshSessionPromise?: Promise<SessionKeyResponse>;
  private readonly onSessionKeyChange?: SessionKeyCallback;

  constructor(
    apiEndpoint: string,
    apiAccessKey: string,
    onSessionKeyChange?: SessionKeyCallback,
  ) {
    this.apiEndpoint = apiEndpoint;
    this.apiAccessKey = apiAccessKey;
    this.onSessionKeyChange = onSessionKeyChange;
    this.axiosSessionInstance = axios.create({
      baseURL: apiEndpoint,
    });

    // #region Interceptors
    // Interceptor that ensures a session key is present for all requests made via the instance
    this.axiosSessionInstance.interceptors.request.use(async (config) => {
      // Acquire session key lazily (will return cached key if available)
      const sessionKey = await this.ensureSessionKey();
      this.applySessionKey(config, sessionKey);
      return config;
    });

    // Response interceptor to handle expired session (HTTP 419)
    this.axiosSessionInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const originalRequest = error.config;

        // Session expired - refresh and retry once
        if (status === 419 && originalRequest && !originalRequest.__retried) {
          originalRequest.__retried = true;
          try {
            // Force refresh - we know the current session is invalid
            const { session_key } = await this.refreshSessionKey();
            this.applySessionKey(originalRequest, session_key);
            return this.axiosSessionInstance(originalRequest);
          } catch {
            // Refresh failed - reject with original 419 error
            return Promise.reject(error);
          }
        }

        // Forbidden - clear state entirely (bad access key or permissions)
        if (status === 403) {
          console.error(
            "Hydrus API access forbidden: please check your access key permissions.",
          );
          this.updateSessionKey(undefined);
          this.refreshSessionPromise = undefined;
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Apply session key to request config, removing any access key header.
   */
  private applySessionKey(
    config: { headers: Record<string, string> },
    sessionKey: string,
  ) {
    config.headers[HYDRUS_API_HEADER_SESSION_KEY] = sessionKey;
    if (HYDRUS_API_HEADER_ACCESS_KEY in config.headers) {
      delete config.headers[HYDRUS_API_HEADER_ACCESS_KEY];
    }
  }
  // #endregion Interceptors

  // #region Access
  public static async getApiVersion(apiEndpoint: string) {
    const response = await axios.get(`${apiEndpoint}/api_version`);
    return BaseResponseSchema.parse(response.data);
  }

  public static async requestNewPermissions(
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

  public async refreshSessionKey(): Promise<SessionKeyResponse> {
    // Clear cached key to force a fresh fetch
    this.updateSessionKey(undefined);
    // Reuse in-flight request if one exists, otherwise start a new one
    if (!this.refreshSessionPromise) {
      this.refreshSessionPromise = this.fetchSessionKey();
    }
    return this.refreshSessionPromise;
  }

  public async verifyAccessKey(
    keyType: AccessKeyType,
  ): Promise<VerifyAccessKeyResponse> {
    // We need to perform manual request to control which header is sent
    const headers: Record<string, string> = {};
    if (keyType === "persistent") {
      headers[HYDRUS_API_HEADER_ACCESS_KEY] = this.apiAccessKey;
    } else {
      // Ensure a session key exists, fetching if needed
      const sessionKey = await this.ensureSessionKey();
      headers[HYDRUS_API_HEADER_SESSION_KEY] = sessionKey;
    }
    const response = await axios.get(`${this.apiEndpoint}/verify_access_key`, {
      headers,
    });
    return VerifyAccessKeyResponseSchema.parse(response.data);
  }

  public async getServices(): Promise<GetServicesResponse> {
    const response = await this.axiosSessionInstance.get("/get_services");
    return GetServicesResponseSchema.parse(response.data);
  }
  // #endregion Access

  // #region File actions
  // (No API functions currently needed)
  // #endregion File actions

  // #region Search
  public async searchFiles(
    options: SearchFilesOptions,
  ): Promise<SearchFilesResponse> {
    const { tags, ...rest } = options;
    const response = await this.axiosSessionInstance.get(
      "/get_files/search_files",
      {
        params: {
          tags: JSON.stringify(tags),
          ...rest,
        },
      },
    );
    return SearchFilesResponseSchema.parse(response.data);
  }

  public async getFileMetadata(
    file_ids: Array<number>,
    only_return_basic_information = true,
  ): Promise<GetFileMetadataResponse> {
    const response = await this.axiosSessionInstance.get(
      "/get_files/file_metadata",
      {
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
      },
    );
    return GetFileMetadataResponseSchema.parse(response.data);
  }
  // #endregion Search

  // #region Pages
  public async getPages(): Promise<GetPagesResponse> {
    const response = await this.axiosSessionInstance.get(
      "/manage_pages/get_pages",
    );
    return GetPagesResponseSchema.parse(response.data);
  }

  public async getPageInfo(
    pageKey: string,
    simple = true,
  ): Promise<GetPageInfoResponse> {
    const response = await this.axiosSessionInstance.get(
      "/manage_pages/get_page_info",
      {
        params: {
          page_key: pageKey,
          simple,
        },
      },
    );
    return GetPageInfoResponseSchema.parse(response.data);
  }

  public async refreshPage(pageKey: string): Promise<void> {
    await this.axiosSessionInstance.post("/manage_pages/refresh_page", {
      page_key: pageKey,
    });
  }

  public async focusPage(pageKey: string): Promise<void> {
    await this.axiosSessionInstance.post("/manage_pages/focus_page", {
      page_key: pageKey,
    });
  }
  // #endregion Pages

  // #region Database
  public async getClientOptions(): Promise<GetClientOptionsResponse> {
    const response = await this.axiosSessionInstance.get(
      "/manage_database/get_client_options",
    );
    return GetClientOptionsResponseSchema.parse(response.data);
  }
  // #endregion Database

  // #region Internal helpers
  /**
   * Updates the session key and notifies the callback. Use whenever the session key changes.
   */
  private updateSessionKey(newKey?: string) {
    this.sessionKey = newKey;
    this.onSessionKeyChange?.(newKey);
  }
  /**
   * Ensures a session key is available (lazy initialization).
   * Returns immediately if a valid session key exists, otherwise fetches one.
   * Uses single-flight pattern to prevent redundant network requests.
   */
  private async ensureSessionKey(): Promise<string> {
    if (this.sessionKey) return this.sessionKey;
    // Reuse in-flight refresh if one exists, otherwise start a new one
    if (!this.refreshSessionPromise) {
      this.refreshSessionPromise = this.fetchSessionKey();
    }
    const response = await this.refreshSessionPromise;
    return response.session_key;
  }

  /**
   * Fetches a new session key from the API. Internal method - use refreshSessionKey() or ensureSessionKey().
   */
  private async fetchSessionKey(): Promise<SessionKeyResponse> {
    try {
      const response = await axios.get(`${this.apiEndpoint}/session_key`, {
        headers: { [HYDRUS_API_HEADER_ACCESS_KEY]: this.apiAccessKey },
      });
      const parsed = SessionKeyResponseSchema.parse(response.data);
      this.updateSessionKey(parsed.session_key);
      return parsed;
    } finally {
      this.refreshSessionPromise = undefined;
    }
  }
  // #endregion Internal helpers
}
