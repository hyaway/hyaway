import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { HydrusApiClient } from "./api-client";
import type { StateCreator } from "zustand";
import { getContext } from "@/integrations/tanstack-query/root-provider.tsx";

type AuthState = {
  api_access_key: string;
  api_endpoint: string;
  sessionKey: string;
  apiClient: HydrusApiClient | null;
  actions: {
    setApiCredentials: (
      accessKey: string | null | undefined,
      endpoint: string | null | undefined,
    ) => void;
    setSessionKey: (sessionKey: string | undefined) => void;
    reset: () => void;
  };
};

const authSlice: StateCreator<AuthState> = (set, get, store) => ({
  api_access_key: "",
  api_endpoint: "",
  sessionKey: "",
  apiClient: null,
  actions: {
    setApiCredentials: (
      accessKey: string | null | undefined,
      endpoint: string | null | undefined,
    ) => {
      const {
        api_access_key: previousApiAccessKey,
        api_endpoint: previousApiEndpoint,
        apiClient: previousApiClient,
      } = get();

      const nextApiAccessKey =
        accessKey === undefined ? previousApiAccessKey : (accessKey ?? "");
      const nextApiEndpoint =
        endpoint === undefined ? previousApiEndpoint : (endpoint ?? "");

      if (nextApiAccessKey && nextApiEndpoint) {
        if (
          !previousApiClient ||
          nextApiAccessKey !== previousApiAccessKey ||
          nextApiEndpoint !== previousApiEndpoint
        ) {
          // Clear session key when credentials change
          set({
            api_access_key: nextApiAccessKey,
            api_endpoint: nextApiEndpoint,
            sessionKey: "",
            apiClient: new HydrusApiClient(
              nextApiEndpoint,
              nextApiAccessKey,
              (sk) => get().actions.setSessionKey(sk),
            ),
          });
          getContext().queryClient.resetQueries();
        }
      } else {
        set({
          api_access_key: nextApiAccessKey,
          api_endpoint: nextApiEndpoint,
          sessionKey: "",
          apiClient: null,
        });
        getContext().queryClient.resetQueries();
      }
    },
    setSessionKey: (sessionKey: string | undefined) => {
      set({ sessionKey: sessionKey ?? "" });
    },
    reset: () => {
      const initialState = store.getInitialState();
      set({
        ...initialState,
        apiClient: null,
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

export const useApiSessionKey = () => useAuthStore((state) => state.sessionKey);

export const useAuthActions = () => useAuthStore((state) => state.actions);
