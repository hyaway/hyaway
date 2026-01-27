// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  HYDRUS_API_HEADER_ACCESS_KEY,
  HYDRUS_API_HEADER_SESSION_KEY,
} from "./models";
import type { StateCreator } from "zustand";
import { getContext } from "@/integrations/tanstack-query/root-provider.tsx";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

/**
 * Preset endpoint from environment variable (set at build time).
 * ⚠️ This value is embedded in the JavaScript bundle.
 */
export const PRESET_ENDPOINT = import.meta.env.VITE_HYDRUS_ENDPOINT ?? "";

/**
 * Preset access key from environment variable (set at build time).
 * ⚠️ This value is embedded in the JavaScript bundle, exposing it to all users.
 */
export const PRESET_ACCESS_KEY = import.meta.env.VITE_HYDRUS_ACCESS_KEY ?? "";

type AuthState = {
  api_access_key: string;
  api_endpoint: string;
  sessionKey: string;
  /**
   * Whether to use session key instead of access key for API requests
   */
  authWithSessionKey: boolean;
  actions: {
    setApiCredentials: (
      accessKey: string | null | undefined,
      endpoint: string | null | undefined,
    ) => void;
    setSessionKey: (sessionKey: string | undefined) => void;
    setAuthWithSessionKey: (authWithSessionKey: boolean) => void;
    reset: () => void;
  };
};

const authSlice: StateCreator<AuthState> = (set, get, store) => ({
  api_access_key: PRESET_ACCESS_KEY,
  api_endpoint: PRESET_ENDPOINT,
  sessionKey: "",
  authWithSessionKey: true,
  actions: {
    setApiCredentials: (
      accessKey: string | null | undefined,
      endpoint: string | null | undefined,
    ) => {
      const {
        api_access_key: previousApiAccessKey,
        api_endpoint: previousApiEndpoint,
      } = get();

      const nextApiAccessKey =
        accessKey === undefined ? previousApiAccessKey : (accessKey ?? "");
      // Normalize endpoint by trimming whitespace and removing trailing slashes
      const nextApiEndpoint =
        endpoint === undefined
          ? previousApiEndpoint
          : (endpoint ?? "").trim().replace(/\/+$/, "");

      // Disable session key auth for HTTP endpoints (less secure transport)
      const isHttpEndpoint =
        endpoint !== undefined &&
        nextApiEndpoint.toLowerCase().startsWith("http://");

      const credentialsChanged =
        nextApiAccessKey !== previousApiAccessKey ||
        nextApiEndpoint !== previousApiEndpoint;

      if (credentialsChanged) {
        // Clear session key when credentials change
        set({
          api_access_key: nextApiAccessKey,
          api_endpoint: nextApiEndpoint,
          sessionKey: "",
          // Disable session key auth for HTTP endpoints
          ...(isHttpEndpoint && { authWithSessionKey: false }),
        });
        getContext().queryClient.resetQueries();
      } else {
        if (endpoint !== undefined) {
          getContext().queryClient.resetQueries({
            queryKey: ["apiVersion"],
          });
        }
        getContext().queryClient.resetQueries({
          queryKey: ["verifyAccess"],
        });
      }
    },
    setSessionKey: (sessionKey: string | undefined) => {
      const { sessionKey: previousSessionKey } = get();
      const newSessionKey = sessionKey ?? "";

      if (newSessionKey !== previousSessionKey) {
        set({ sessionKey: newSessionKey });
      }
    },
    setAuthWithSessionKey: (authWithSessionKey: boolean) => {
      const { authWithSessionKey: previousValue } = get();

      if (authWithSessionKey !== previousValue) {
        set({ authWithSessionKey });
      }
    },
    reset: () => {
      const initialState = store.getInitialState();
      set({
        ...initialState,
      });
      getContext().queryClient.removeQueries();
    },
  },
});

export const useAuthStore = create<AuthState>()(
  persist(authSlice, {
    name: "hyaway-hydrus-api-token-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      api_access_key: state.api_access_key,
      api_endpoint: state.api_endpoint,
      sessionKey: state.sessionKey,
      authWithSessionKey: state.authWithSessionKey,
    }),
    merge: (persisted, current) => ({
      ...current,
      ...(persisted as Partial<AuthState>),
      // Normalize endpoint by trimming whitespace and removing trailing slashes from old stored values
      api_endpoint:
        (persisted as Partial<AuthState>)?.api_endpoint
          ?.trim()
          .replace(/\/+$/, "") ?? current.api_endpoint,
    }),
    onRehydrateStorage: () => () => {
      getContext().queryClient.invalidateQueries();
    },
  }),
);

export const useApiEndpoint = () => useAuthStore((state) => state.api_endpoint);

export const useApiAccessKey = () =>
  useAuthStore((state) => state.api_access_key);

export const useApiSessionKey = () => useAuthStore((state) => state.sessionKey);

/**
 * Returns true if the API is configured (has both endpoint and access key)
 */
export const useIsApiConfigured = () =>
  useAuthStore((state) => !!(state.api_endpoint && state.api_access_key));

export const useAuthActions = () => useAuthStore((state) => state.actions);

/**
 * Whether to use session key instead of access key for API requests
 */
export const useAuthWithSessionKey = () =>
  useAuthStore((state) => state.authWithSessionKey);

/**
 * Returns the appropriate auth key (session or access) based on the authWithSessionKey setting.
 * Use for constructing URLs that need authentication.
 */
export const useAuthKey = () =>
  useAuthStore((state) =>
    state.authWithSessionKey ? state.sessionKey : state.api_access_key,
  );

/**
 * Returns the appropriate auth header name based on the authWithSessionKey setting.
 */
export const useAuthHeaderName = () =>
  useAuthStore((state) =>
    state.authWithSessionKey
      ? HYDRUS_API_HEADER_SESSION_KEY
      : HYDRUS_API_HEADER_ACCESS_KEY,
  );

// Sync auth config across tabs
setupCrossTabSync(useAuthStore);
