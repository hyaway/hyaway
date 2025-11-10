import axios from "axios";
import {
  GetFileMetadataResponseSchema,
  GetPageInfoResponseSchema,
  GetPagesResponseSchema,
  HYDRUS_API_HEADER_ACCESS_KEY,
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

  constructor(apiEndpoint: string, apiAccessKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiAccessKey = apiAccessKey;
    this.hash = simpleHash(apiEndpoint + apiAccessKey);
    this.axiosInstance = axios.create({
      baseURL: apiEndpoint,
    });

    this.axiosInstance.interceptors.request.use((config) => {
      config.headers[HYDRUS_API_HEADER_ACCESS_KEY] = this.apiAccessKey;
      return config;
    });
  }

  // #region Access management
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

  public async getSessionKey(): Promise<SessionKeyResponse> {
    const response = await this.axiosInstance.get("/session_key");
    return SessionKeyResponseSchema.parse(response.data);
  }

  public async verifyAccessKey(): Promise<VerifyAccessKeyResponse> {
    const response = await this.axiosInstance.get("/verify_access_key");
    return VerifyAccessKeyResponseSchema.parse(response.data);
  }

  public async getServices(): Promise<GetServicesResponse> {
    const response = await this.axiosInstance.get("/get_services");
    return response.data;
  }
  // #endregion Access management

  // #region Importing and deleting files
  // (No API functions currently needed)
  // #endregion Importing and deleting files

  // #region Searching and fetching files
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
  // #endregion Searching and fetching files

  // #region Managing pages
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
  // #endregion Managing pages

  // #region Managing the database
  public async getClientOptions(): Promise<GetClientOptionsResponse> {
    const response = await this.axiosInstance.get(
      "/manage_database/get_client_options",
    );
    return response.data;
  }
  // #endregion Managing the database

  public toJSON() {
    return this.hash;
  }
}
