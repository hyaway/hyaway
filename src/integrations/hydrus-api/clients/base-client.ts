// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import axios from "axios";

import { useAuthStore } from "../hydrus-config-store";

import type { AxiosRequestConfig } from "axios";

/**
 * Creates a base axios instance with common configuration.
 * Disables browser caching since Hydrus API has a 4-second server cache.
 */
export function createBaseClient(config?: AxiosRequestConfig) {
  const client = axios.create({
    headers: {
      "Content-Type": "application/json",
      // Prevent browser from caching API responses
      // Hydrus API has a 4-second server-side cache, browser caching on top causes stale data
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
    // 10s timeout to prevent indefinite blocking on unreachable endpoints
    timeout: 10000,
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
