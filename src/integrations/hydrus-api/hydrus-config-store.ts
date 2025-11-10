import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { HydrusApiClient } from "./api-client";
import type { StateCreator } from "zustand";
import { getContext } from "@/integrations/tanstack-query/root-provider.tsx";

type AuthState = {
  api_access_key: string | null;
  api_endpoint: string | null;
  apiClient: HydrusApiClient | null;
  actions: {
    setApiCredentials: (accessKey: string, endpoint: string) => void;
    reset: () => void;
  };
};

const authSlice: StateCreator<AuthState> = (set, get, store) => ({
  api_access_key: null,
  api_endpoint: null,
  apiClient: null,
  actions: {
    setApiCredentials: (accessKey: string | null, endpoint: string | null) => {
      const {
        api_access_key: previousApiAccessKey,
        api_endpoint: previousApiEndpoint,
        apiClient: previousApiClient,
      } = get();
      let nextApiClient = previousApiClient;
      if (accessKey && endpoint) {
        if (
          accessKey !== previousApiAccessKey ||
          endpoint !== previousApiEndpoint ||
          !previousApiClient
        ) {
          nextApiClient = new HydrusApiClient(endpoint, accessKey);
        }
      } else {
        nextApiClient = null;
      }
      set({
        api_access_key: accessKey,
        api_endpoint: endpoint,
        apiClient: nextApiClient,
      });
      getContext().queryClient.clear();
    },
    reset: () => {
      const initialState = store.getInitialState();
      set({
        ...initialState,
        apiClient: null,
      });
      getContext().queryClient.clear();
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
    }),
    onRehydrateStorage: () => (state) => {
      if (state) {
        state.actions.setApiCredentials(
          state.api_access_key,
          state.api_endpoint,
        );
      }
    },
  }),
);

export const useApiEndpoint = () => useAuthStore((state) => state.api_endpoint);

export const useApiAccessKey = () =>
  useAuthStore((state) => state.api_access_key);

export const useHydrusApiClient = () =>
  useAuthStore((state) => state.apiClient);

export const useAuthActions = () => useAuthStore((state) => state.actions);
