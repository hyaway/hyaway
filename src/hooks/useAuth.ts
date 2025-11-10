import {  create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {StateCreator} from "zustand";

type AuthState = {
  api_access_key: string;
  api_endpoint: string;
  actions: {
    setApiCredentials: (accessKey: string, endpoint: string) => void;
    reset: () => void;
  };
};

const authSlice: StateCreator<AuthState> = (set, get, store) => ({
  api_access_key: "",
  api_endpoint: "",
  actions: {
    setApiCredentials: (accessKey: string, endpoint: string) =>
      set({ api_access_key: accessKey, api_endpoint: endpoint }),
    reset: () => {
      set(store.getInitialState());
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
  }),
);

export const useApiAccessKey = () =>
  useAuthStore((state) => state.api_access_key);

export const useApiEndpoint = () => useAuthStore((state) => state.api_endpoint);

export const useAuthActions = () => useAuthStore((state) => state.actions);
