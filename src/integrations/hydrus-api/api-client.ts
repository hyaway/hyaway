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
import { simpleHash } from "@/lib/utils";

export class HydrusApiClient {
  public readonly apiEndpoint: string;
  private readonly apiAccessKey: string;
  // Hash that uniquely (and opaquely) represents this client instance. Recomputed when session key changes.
  private hash: number;
  private readonly axiosSessionInstance: AxiosInstance;
  private sessionKey?: string; // Lazily acquired session key
  private refreshSessionPromise?: Promise<SessionKeyResponse>; // Single-flight promise for concurrent refreshes

  constructor(apiEndpoint: string, apiAccessKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiAccessKey = apiAccessKey;
    // Initial hash excludes session key (not yet acquired)
    this.hash = simpleHash(apiEndpoint + apiAccessKey);
    this.axiosSessionInstance = axios.create({
      baseURL: apiEndpoint,
    });

    // #region Interceptors
    // Interceptor that ensures a session key is present for all requests made via the instance
    this.axiosSessionInstance.interceptors.request.use(async (config) => {
      // Acquire session key lazily
      if (!this.sessionKey) {
        try {
          await this.ensureSessionKey();
        } catch (err) {
          // Propagate error: we are not allowed to use the access key for ordinary endpoints
          return Promise.reject(err);
        }
      }

      if (this.sessionKey) {
        // Set session key header; ensure no access key leaks
        if (HYDRUS_API_HEADER_ACCESS_KEY in config.headers) {
          delete config.headers[HYDRUS_API_HEADER_ACCESS_KEY];
        }
        config.headers[HYDRUS_API_HEADER_SESSION_KEY] = this.sessionKey;
      }
      return config;
    });

    // Response interceptor to handle expired session (HTTP 419)
    this.axiosSessionInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const originalRequest = error.config;
        if (status === 419 && originalRequest && !originalRequest.__retried) {
          originalRequest.__retried = true;
          // Mark current session key invalid, but retain any in-flight refresh promise (single-flight).
          this.setSessionKey(undefined);
          try {
            await this.ensureSessionKey();
            // Replace headers: remove access key if present, set new session key
            if (
              originalRequest.headers &&
              HYDRUS_API_HEADER_ACCESS_KEY in originalRequest.headers
            ) {
              delete originalRequest.headers[HYDRUS_API_HEADER_ACCESS_KEY];
            }
            originalRequest.headers[HYDRUS_API_HEADER_SESSION_KEY] =
              this.sessionKey!;
            return this.axiosSessionInstance(originalRequest);
          } catch (refreshErr) {
            return Promise.reject(error);
          }
        }
        if (status === 403) {
          console.error(
            "Hydrus API access forbidden: please check your access key permissions.",
          );
          this.setSessionKey(undefined);
          this.refreshSessionPromise = undefined;
        }
        return Promise.reject(error);
      },
    );
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
    // Single-flight: if a refresh is already in progress, reuse it
    if (this.refreshSessionPromise) return this.refreshSessionPromise;
    // Intentionally clear cached key so callers relying on ensureSessionKey won't serve stale
    this.setSessionKey(undefined);
    this.refreshSessionPromise = axios
      .get(`${this.apiEndpoint}/session_key`, {
        headers: { [HYDRUS_API_HEADER_ACCESS_KEY]: this.apiAccessKey },
      })
      .then((response) => {
        const parsed = SessionKeyResponseSchema.parse(response.data);
        this.setSessionKey(parsed.session_key);
        return parsed;
      })
      .finally(() => {
        // Clear promise reference so subsequent refreshes can start new cycle
        this.refreshSessionPromise = undefined;
      });
    return this.refreshSessionPromise;
  }

  /**
   * Returns the currently cached session key without triggering any network request.
   * If no session key has been acquired yet, returns undefined. Use `refreshSessionKey()`
   * to force retrieval or allow the request interceptor to fetch it lazily.
   */
  public getSessionKey(): string | undefined {
    return this.sessionKey;
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
      await this.ensureSessionKey();
      headers[HYDRUS_API_HEADER_SESSION_KEY] = this.sessionKey!;
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

  public toJSON() {
    return this.hash;
  }

  // #region Internal helpers
  /**
   * Internal setter that updates the session key and recomputes the hash. Use whenever the session key changes.
   */
  private setSessionKey(newKey?: string) {
    this.sessionKey = newKey;
    this.hash = simpleHash(this.apiEndpoint + this.apiAccessKey + newKey);
  }
  /**
   * Ensures a session key is available (lazy initialization). Uses a raw axios call to avoid interceptor recursion.
   */
  private async ensureSessionKey(): Promise<string> {
    if (this.sessionKey) return this.sessionKey;
    const response = await this.refreshSessionKey();
    return response.session_key;
  }
  // #endregion Internal helpers
}
