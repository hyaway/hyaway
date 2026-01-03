import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export const MAX_RECENT_FILES_LIMIT = 10000;
export const MAX_RECENT_FILES_DAYS = 30;

type RecentFilesSettingsState = {
  limit: number;
  days: number;
  actions: {
    setLimit: (limit: number) => void;
    setDays: (days: number) => void;
  };
};

const useRecentFilesSettingsStore = create<RecentFilesSettingsState>()(
  persist(
    (set) => ({
      limit: 100,
      days: 3,
      actions: {
        setLimit: (limit: number) => set({ limit }),
        setDays: (days: number) => set({ days }),
      },
    }),
    {
      name: "recent-files-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useRecentFilesLimit = () =>
  useRecentFilesSettingsStore((state) => state.limit);

export const useRecentFilesDays = () =>
  useRecentFilesSettingsStore((state) => state.days);

export const useRecentFilesSettingsActions = () =>
  useRecentFilesSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useRecentFilesSettingsStore);
