import { useAuthStore } from "../hydrus-config-store";
import { HYDRUS_API_HEADER_SESSION_KEY } from "../models";

import { fetchSessionKey } from "./access-key-client";
import { createBaseClient } from "./base-client";

import type { AxiosRequestConfig } from "axios";
import type { SessionKeyResponse } from "../models";

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Single-flight pattern for session refresh
let refreshPromise: Promise<SessionKeyResponse> | undefined;
// Request queue interceptor ID (set during refresh)
let queueInterceptorId: number | undefined;

/**
 * Ensure a session key exists, fetching one if needed.
 * If a refresh is in progress, waits for it to complete.
 */
async function ensureSessionKey(): Promise<string> {
  // If refresh is in progress, wait for it
  if (refreshPromise) {
    const result = await refreshPromise;
    return result.session_key;
  }

  const { sessionKey } = useAuthStore.getState();
  if (sessionKey) return sessionKey;

  refreshPromise = fetchSessionKey().finally(() => {
    refreshPromise = undefined;
  });
  const result = await refreshPromise;
  return result.session_key;
}

/**
 * Force refresh the session key.
 * Queues all incoming requests until refresh completes.
 */
export async function refreshSessionKey(): Promise<SessionKeyResponse> {
  const { actions } = useAuthStore.getState();
  actions.setSessionKey(undefined);

  if (!refreshPromise) {
    // Queue incoming requests during refresh
    queueInterceptorId = sessionKeyClient.interceptors.request.use(
      async (config) => {
        // Wait for refresh to complete before allowing request
        if (refreshPromise) {
          await refreshPromise;
        }
        return config;
      },
    );

    refreshPromise = fetchSessionKey().finally(() => {
      // Eject queue interceptor when done
      if (queueInterceptorId !== undefined) {
        sessionKeyClient.interceptors.request.eject(queueInterceptorId);
        queueInterceptorId = undefined;
      }
      refreshPromise = undefined;
    });
  }

  return refreshPromise;
}

/**
 * Axios client that uses session key authentication.
 * Automatically refreshes the session key on 419 errors.
 */
export const sessionKeyClient = createBaseClient();

// Request interceptor: inject session key
sessionKeyClient.interceptors.request.use(async (config) => {
  const sessionKey = await ensureSessionKey();
  config.headers[HYDRUS_API_HEADER_SESSION_KEY] = sessionKey;

  return config;
});

// Response interceptor: handle 419 (session expired)
sessionKeyClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (
      error.response?.status === 419 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const { session_key } = await refreshSessionKey();
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers[HYDRUS_API_HEADER_SESSION_KEY] = session_key;

      return sessionKeyClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
