// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useAuthStore } from "../hydrus-config-store";
import {
  HYDRUS_API_HEADER_ACCESS_KEY,
  HYDRUS_API_HEADER_SESSION_KEY,
} from "../models";

import { fetchSessionKey } from "./access-key-client";
import { createBaseClient } from "./base-client";

import type { AxiosRequestConfig } from "axios";

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
  /** The session key that was used when the request was first made */
  _sessionKeyUsed?: string;
}

const SESSION_KEY_LOCK = "hyaway-session-key-refresh";

/**
 * Simple in-memory lock for environments without Web Locks API.
 * Web Locks requires a secure context (HTTPS or localhost).
 * Plain HTTP on LAN (e.g., http://192.168.x.x) doesn't have navigator.locks.
 *
 * This fallback provides single-tab mutual exclusion but no cross-tab coordination.
 */
const fallbackLocks = new Map<string, Promise<unknown>>();

async function withLock<T>(
  name: string,
  callback: () => Promise<T>,
): Promise<T> {
  // Use native Web Locks if available (secure context)
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return navigator.locks.request(name, callback);
  }

  // Fallback: simple promise-based lock for non-secure contexts
  // Wait for any existing lock to release
  const existingLock = fallbackLocks.get(name);
  if (existingLock) {
    await existingLock.catch(() => {});
  }

  // Create and store our lock promise
  const lockPromise = callback();
  fallbackLocks.set(name, lockPromise);

  try {
    return await lockPromise;
  } finally {
    // Only delete if it's still our lock (not replaced by another)
    if (fallbackLocks.get(name) === lockPromise) {
      fallbackLocks.delete(name);
    }
  }
}

/**
 * Ensure a session key exists, fetching one if needed.
 * Uses Web Locks (when available) to coordinate concurrent requests and cross-tab refresh.
 * Falls back to simple promise-based locking in non-secure contexts (plain HTTP).
 */
async function ensureSessionKey(): Promise<string> {
  const { sessionKey } = useAuthStore.getState();
  if (sessionKey) return sessionKey;

  // Acquire exclusive lock and fetch session key
  return withLock(SESSION_KEY_LOCK, async () => {
    // Double-check after acquiring lock (another tab may have fetched it while we waited)
    const { sessionKey: currentKey } = useAuthStore.getState();
    if (currentKey) return currentKey;

    const result = await fetchSessionKey();
    return result.session_key;
  });
}

/**
 * Force refresh the session key.
 * Uses Web Locks (when available) to ensure only one tab/request refreshes at a time.
 * If another tab already refreshed while we waited for the lock, uses that key.
 *
 * @param expiredKey - The session key to replace. Used to detect if another tab
 *                     already refreshed while we waited for the lock.
 */
export async function refreshSessionKey(expiredKey: string): Promise<string> {
  return withLock(SESSION_KEY_LOCK, async () => {
    // Check if another tab already refreshed while we waited for the lock
    const { sessionKey: currentKey } = useAuthStore.getState();
    if (currentKey && currentKey !== expiredKey) {
      // Token changed while we waited - another tab refreshed it
      return currentKey;
    }

    // Fetch new session key (fetchSessionKey stores it automatically)
    const response = await fetchSessionKey();
    return response.session_key;
  });
}

/**
 * Axios client that uses session key authentication (or access key if session keys disabled).
 * Automatically refreshes the session key on 419 errors.
 */
export const sessionKeyClient = createBaseClient();

// Request interceptor: inject session key or access key based on setting
sessionKeyClient.interceptors.request.use(async (config) => {
  const retryableConfig = config as RetryableConfig;
  const { authWithSessionKey, api_access_key } = useAuthStore.getState();

  // If session keys are disabled, use access key directly
  if (!authWithSessionKey) {
    config.headers[HYDRUS_API_HEADER_ACCESS_KEY] = api_access_key;
    return config;
  }

  // Skip session key fetch if this is a retry - the 419 handler already set the new key
  if (retryableConfig._retry) {
    return config;
  }

  const sessionKey = await ensureSessionKey();
  config.headers[HYDRUS_API_HEADER_SESSION_KEY] = sessionKey;

  // Track which session key we used (for detecting stale 419s)
  retryableConfig._sessionKeyUsed = sessionKey;

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

      // Pass the expired key so refreshSessionKey can detect if another tab already refreshed
      const expiredKey =
        originalRequest._sessionKeyUsed ??
        (originalRequest.headers?.[HYDRUS_API_HEADER_SESSION_KEY] as
          | string
          | undefined) ??
        "";
      const sessionKey = await refreshSessionKey(expiredKey);

      // Update the session key for retry - ensure headers object exists
      if (!originalRequest.headers) {
        originalRequest.headers = {};
      }
      // Delete old key and set new one (handles both plain objects and AxiosHeaders)
      delete originalRequest.headers[HYDRUS_API_HEADER_SESSION_KEY];
      originalRequest.headers[HYDRUS_API_HEADER_SESSION_KEY] = sessionKey;
      originalRequest._sessionKeyUsed = sessionKey;

      return sessionKeyClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
