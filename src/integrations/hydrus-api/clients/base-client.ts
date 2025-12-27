import axios from "axios";

import { useAuthStore } from "../hydrus-config-store";

import type { AxiosRequestConfig } from "axios";

/**
 * Creates a base axios instance with common configuration.
 */
export function createBaseClient(config?: AxiosRequestConfig) {
  const client = axios.create({
    headers: {
      "Content-Type": "application/json",
    },
    ...config,
  });

  // Inject base URL from Zustand store
  client.interceptors.request.use((reqConfig) => {
    const { api_endpoint } = useAuthStore.getState();

    if (!api_endpoint) {
      throw new Error("Hydrus API endpoint is not configured.");
    }

    reqConfig.baseURL = api_endpoint;
    return reqConfig;
  });

  return client;
}

/**
 * Base axios instance with endpoint injection.
 */
export const baseClient = createBaseClient();
