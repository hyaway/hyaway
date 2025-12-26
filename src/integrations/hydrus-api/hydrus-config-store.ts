import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StateCreator } from "zustand";
import { getContext } from "@/integrations/tanstack-query/root-provider.tsx";
import { simpleHash } from "@/lib/simple-hash";

type AuthState = {
  api_access_key: string;
  api_endpoint: string;
  sessionKey: string;
  /**
   * Hash of endpoint + access key, used as query key prefix for cache invalidation
   */
  accessKeyHash: number;
  /**
   * Hash of endpoint + session key, used as query key prefix for cache invalidation
   */
  sessionKeyHash: number;
  actions: {
    setApiCredentials: (
      accessKey: string | null | undefined,
      endpoint: string | null | undefined,
    ) => void;
    setSessionKey: (sessionKey: string | undefined) => void;
    reset: () => void;
  };
};

/**
 * Compute hash for endpoint + key combination
 */
const computeHash = (endpoint: string, key: string): number => {
  if (!endpoint || !key) return 0;
  return simpleHash(`${endpoint}:${key}`);
};

const authSlice: StateCreator<AuthState> = (set, get, store) => ({
  api_access_key: "",
  api_endpoint: "",
  sessionKey: "",
  accessKeyHash: 0,
  sessionKeyHash: 0,
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
      const nextApiEndpoint =
        endpoint === undefined ? previousApiEndpoint : (endpoint ?? "");

      const credentialsChanged =
        nextApiAccessKey !== previousApiAccessKey ||
        nextApiEndpoint !== previousApiEndpoint;

      // Also need to compute hash if missing (e.g., after rehydration from localStorage)
      const needsHashComputation =
        !get().accessKeyHash && nextApiAccessKey && nextApiEndpoint;

      if (credentialsChanged) {
        // Compute new access key hash
        const newAccessKeyHash = computeHash(nextApiEndpoint, nextApiAccessKey);

        // Clear session key when credentials change
        set({
          api_access_key: nextApiAccessKey,
          api_endpoint: nextApiEndpoint,
          sessionKey: "",
          accessKeyHash: newAccessKeyHash,
          sessionKeyHash: 0,
        });
        getContext().queryClient.resetQueries();
      } else if (needsHashComputation) {
        // Rehydration case: compute hash without resetting queries
        const newAccessKeyHash = computeHash(nextApiEndpoint, nextApiAccessKey);
        set({ accessKeyHash: newAccessKeyHash });
      }
    },
    setSessionKey: (sessionKey: string | undefined) => {
      const { api_endpoint } = get();
      const newSessionKey = sessionKey ?? "";
      const newSessionKeyHash = computeHash(api_endpoint, newSessionKey);
      set({
        sessionKey: newSessionKey,
        sessionKeyHash: newSessionKeyHash,
      });
    },
    reset: () => {
      const initialState = store.getInitialState();
      set({
        ...initialState,
      });
      getContext().queryClient.resetQueries();
    },
  },
});

export const useAuthStore = create<AuthState>()(
  persist(authSlice, {
    name: "hydrus-api-token-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      api_access_key: state.api_access_key,
      api_endpoint: state.api_endpoint,
      sessionKey: state.sessionKey,
    }),
    onRehydrateStorage: () => (state) => {
      if (state) {
        state.actions.setApiCredentials(
          state.api_access_key,
          state.api_endpoint,
        );
        // Recompute session key hash after rehydration
        if (state.sessionKey) {
          state.actions.setSessionKey(state.sessionKey);
        }
      }
    },
  }),
);

export const useApiEndpoint = () => useAuthStore((state) => state.api_endpoint);

export const useApiAccessKey = () =>
  useAuthStore((state) => state.api_access_key);

export const useApiSessionKey = () => useAuthStore((state) => state.sessionKey);

/**
 * Hash of endpoint + access key. Use in query keys to enable/invalidate queries when credentials change.
 */
export const useAccessKeyHash = () =>
  useAuthStore((state) => state.accessKeyHash);

/**
 * Hash of endpoint + session key. Use in query keys to enable/invalidate queries when session changes.
 */
export const useSessionKeyHash = () =>
  useAuthStore((state) => state.sessionKeyHash);

/**
 * Returns true if the API is configured (has both endpoint and access key)
 */
export const useIsApiConfigured = () =>
  useAuthStore((state) => !!(state.api_endpoint && state.api_access_key));

export const useAuthActions = () => useAuthStore((state) => state.actions);
