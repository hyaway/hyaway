import axios from "axios";
import {
  GetFileMetadataResponseSchema,
  GetPageInfoResponseSchema,
  GetPagesResponseSchema,
  HYDRUS_API_HEADER_ACCESS_KEY,
  HYDRUS_API_HEADER_SESSION_KEY,
  RequestNewPermissionsResponseSchema,
  SearchFilesResponseSchema,
  SessionKeyResponseSchema,
  VerifyAccessKeyResponseSchema,
} from "./models";
import type {
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
  private readonly hash: number;
  private readonly axiosInstance: AxiosInstance;
  private sessionKey?: string; // Lazily acquired session key
  private refreshSessionPromise?: Promise<SessionKeyResponse>; // Single-flight promise for concurrent refreshes

  constructor(apiEndpoint: string, apiAccessKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiAccessKey = apiAccessKey;
    this.hash = simpleHash(apiEndpoint + apiAccessKey);
    this.axiosInstance = axios.create({
      baseURL: apiEndpoint,
    });

    // Interceptor that ensures a session key is present for all requests
    this.axiosInstance.interceptors.request.use(async (config) => {
      // Always send access key only for the session key creation endpoint
      if (config.url && config.url.endsWith("/session_key")) {
        config.headers[HYDRUS_API_HEADER_ACCESS_KEY] = this.apiAccessKey;
        return config;
      }

      // Acquire session key lazily
      if (!this.sessionKey) {
        try {
          await this.ensureSessionKey();
        } catch (err) {
          // If session key acquisition fails, fall back to access key so caller still gets an auth attempt
          config.headers[HYDRUS_API_HEADER_ACCESS_KEY] = this.apiAccessKey;
          return config;
        }
      }

      if (this.sessionKey) {
        // Prefer session key header; remove access key header if set
        if (HYDRUS_API_HEADER_ACCESS_KEY in config.headers) {
          delete config.headers[HYDRUS_API_HEADER_ACCESS_KEY];
        }
        config.headers[HYDRUS_API_HEADER_SESSION_KEY] = this.sessionKey;
      } else {
        // Fallback (should rarely happen)
        config.headers[HYDRUS_API_HEADER_ACCESS_KEY] = this.apiAccessKey;
      }
      return config;
    });

    // Response interceptor to handle expired session (HTTP 419)
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const originalRequest = error.config;
        if (status === 419 && originalRequest && !originalRequest.__retried) {
          originalRequest.__retried = true;
          // Mark current session key invalid, but retain any in-flight refresh promise (single-flight).
          this.sessionKey = undefined;
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
            return this.axiosInstance(originalRequest);
          } catch (refreshErr) {
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  // #region Access
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
    this.sessionKey = undefined;
    this.refreshSessionPromise = axios
      .get(`${this.apiEndpoint}/session_key`, {
        headers: { [HYDRUS_API_HEADER_ACCESS_KEY]: this.apiAccessKey },
      })
      .then((response) => {
        const parsed = SessionKeyResponseSchema.parse(response.data);
        this.sessionKey = parsed.session_key;
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
    keyType: "session" | "access" = "access",
  ): Promise<VerifyAccessKeyResponse> {
    // We need to perform manual request to control which header is sent
    const headers: Record<string, string> = {};
    if (keyType === "access") {
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
    const response = await this.axiosInstance.get("/get_services");
    return response.data;
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
    const response = await this.axiosInstance.get("/get_files/search_files", {
      params: {
        tags: JSON.stringify(tags),
        ...rest,
      },
    });
    return SearchFilesResponseSchema.parse(response.data);
  }

  public async getFileMetadata(
    file_ids: Array<number>,
    only_return_basic_information = true,
  ): Promise<GetFileMetadataResponse> {
    const response = await this.axiosInstance.get("/get_files/file_metadata", {
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
  // #endregion Search

  // #region Pages
  public async getPages(): Promise<GetPagesResponse> {
    const response = await this.axiosInstance.get("/manage_pages/get_pages");
    return GetPagesResponseSchema.parse(response.data);
  }

  public async getPageInfo(
    pageKey: string,
    simple = true,
  ): Promise<GetPageInfoResponse> {
    const response = await this.axiosInstance.get(
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
    await this.axiosInstance.post("/manage_pages/refresh_page", {
      page_key: pageKey,
    });
  }

  public async focusPage(pageKey: string): Promise<void> {
    await this.axiosInstance.post("/manage_pages/focus_page", {
      page_key: pageKey,
    });
  }
  // #endregion Pages

  // #region Database
  public async getClientOptions(): Promise<GetClientOptionsResponse> {
    const response = await this.axiosInstance.get(
      "/manage_database/get_client_options",
    );
    return response.data;
  }
  // #endregion Database

  public toJSON() {
    return this.hash;
  }

  // #region Internal helpers
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
