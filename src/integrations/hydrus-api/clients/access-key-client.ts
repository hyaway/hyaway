// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useAuthStore } from "../hydrus-config-store";
import {
  HYDRUS_API_HEADER_ACCESS_KEY,
  SessionKeyResponseSchema,
} from "../models";

import { createBaseClient } from "./base-client";

import type { SessionKeyResponse } from "../models";

/**
 * Axios client that uses access key authentication.
 * Automatically injects access key and base URL from Zustand store.
 */
export const accessKeyClient = createBaseClient();

accessKeyClient.interceptors.request.use((config) => {
  const { api_access_key } = useAuthStore.getState();

  if (!api_access_key) {
    throw new Error("Hydrus API access key is not configured.");
  }

  config.headers[HYDRUS_API_HEADER_ACCESS_KEY] = api_access_key;

  return config;
});

/**
 * Fetch a new session key using the access key.
 */
export async function fetchSessionKey(): Promise<SessionKeyResponse> {
  const response = await accessKeyClient.get("/session_key");
  const parsed = SessionKeyResponseSchema.parse(response.data);

  const { actions } = useAuthStore.getState();
  actions.setSessionKey(parsed.session_key);

  return parsed;
}
