import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export const MAX_SEARCH_LIMIT = 10000;
export const MAX_RECENT_FILES_DAYS = 30;

type SearchLimitsState = {
  recentFilesLimit: number;
  recentFilesDays: number;
  randomInboxLimit: number;
  remoteHistoryLimit: number;
  mostViewedLimit: number;
  longestViewedLimit: number;
  actions: {
    setAllLimits: (limit: number) => void;
    setRecentFilesLimit: (limit: number) => void;
    setRecentFilesDays: (days: number) => void;
    setRandomInboxLimit: (limit: number) => void;
    setRemoteHistoryLimit: (limit: number) => void;
    setMostViewedLimit: (limit: number) => void;
    setLongestViewedLimit: (limit: number) => void;
    reset: () => void;
  };
};

const useSearchLimitsStore = create<SearchLimitsState>()(
  persist(
    (set, _get, store) => ({
      recentFilesLimit: 100,
      recentFilesDays: 3,
      randomInboxLimit: 100,
      remoteHistoryLimit: 100,
      mostViewedLimit: 100,
      longestViewedLimit: 100,
      actions: {
        setAllLimits: (limit: number) =>
          set({
            recentFilesLimit: limit,
            randomInboxLimit: limit,
            remoteHistoryLimit: limit,
            mostViewedLimit: limit,
            longestViewedLimit: limit,
          }),
        setRecentFilesLimit: (recentFilesLimit: number) =>
          set({ recentFilesLimit }),
        setRecentFilesDays: (recentFilesDays: number) =>
          set({ recentFilesDays }),
        setRandomInboxLimit: (randomInboxLimit: number) =>
          set({ randomInboxLimit }),
        setRemoteHistoryLimit: (remoteHistoryLimit: number) =>
          set({ remoteHistoryLimit }),
        setMostViewedLimit: (mostViewedLimit: number) =>
          set({ mostViewedLimit }),
        setLongestViewedLimit: (longestViewedLimit: number) =>
          set({ longestViewedLimit }),
        reset: () => set(store.getInitialState()),
      },
    }),
    {
      name: "hyaway-search-limits",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

// Recent files
export const useRecentFilesLimit = () =>
  useSearchLimitsStore((state) => state.recentFilesLimit);

export const useRecentFilesDays = () =>
  useSearchLimitsStore((state) => state.recentFilesDays);

// Random inbox
export const useRandomInboxLimit = () =>
  useSearchLimitsStore((state) => state.randomInboxLimit);

// View statistics
export const useRemoteHistoryLimit = () =>
  useSearchLimitsStore((state) => state.remoteHistoryLimit);

export const useMostViewedLimit = () =>
  useSearchLimitsStore((state) => state.mostViewedLimit);

export const useLongestViewedLimit = () =>
  useSearchLimitsStore((state) => state.longestViewedLimit);

// Actions
export const useSearchLimitsActions = () =>
  useSearchLimitsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useSearchLimitsStore);
