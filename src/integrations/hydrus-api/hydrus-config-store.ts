import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { HydrusApiClient } from "./api-client";
import type { StateCreator } from "zustand";
import { getContext } from "@/integrations/tanstack-query/root-provider.tsx";

type AuthState = {
  api_access_key: string;
  api_endpoint: string;
  apiClient: HydrusApiClient | null;
  actions: {
    setApiCredentials: (accessKey: string, endpoint: string) => void;
    reset: () => void;
  };
};

const authSlice: StateCreator<AuthState> = (set, _get, store) => ({
  api_access_key: "",
  api_endpoint: "",
  apiClient: null,
  actions: {
    setApiCredentials: (accessKey: string, endpoint: string) => {
      const apiClient =
        endpoint && accessKey ? new HydrusApiClient(endpoint, accessKey) : null;
      set({ api_access_key: accessKey, api_endpoint: endpoint, apiClient });
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
