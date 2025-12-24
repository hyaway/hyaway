import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const MAX_GRID_LANES = 30;
export const MAX_PAGES_COLUMNS = 30;
export const MAX_RECENT_FILES_LIMIT = 2000;
export const MAX_RECENT_FILES_DAYS = 30;

export type TagsSortMode = "count" | "namespace";

type UxSettingsState = {
  tagsSortMode: TagsSortMode;
  gridMaxLanes: number;
  gridExpandImages: boolean;
  pagesMaxColumns: number;
  recentFilesLimit: number;
  recentFilesDays: number;
  actions: {
    setTagsSortMode: (mode: TagsSortMode) => void;
    setGridMaxLanes: (lanes: number) => void;
    setGridExpandImages: (expand: boolean) => void;
    setPagesMaxColumns: (columns: number) => void;
    setRecentFilesLimit: (limit: number) => void;
    setRecentFilesDays: (days: number) => void;
  };
};

export const useUxSettingsStore = create<UxSettingsState>()(
  persist(
    (set) => ({
      tagsSortMode: "count",
      gridMaxLanes: MAX_GRID_LANES,
      gridExpandImages: true,
      pagesMaxColumns: MAX_PAGES_COLUMNS,
      recentFilesLimit: 1000,
      recentFilesDays: 3,
      actions: {
        setTagsSortMode: (tagsSortMode: TagsSortMode) => set({ tagsSortMode }),
        setGridMaxLanes: (gridMaxLanes: number) => set({ gridMaxLanes }),
        setGridExpandImages: (gridExpandImages: boolean) =>
          set({ gridExpandImages }),
        setPagesMaxColumns: (pagesMaxColumns: number) =>
          set({ pagesMaxColumns }),
        setRecentFilesLimit: (recentFilesLimit: number) =>
          set({ recentFilesLimit }),
        setRecentFilesDays: (recentFilesDays: number) =>
          set({ recentFilesDays }),
      },
    }),
    {
      name: "ux-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useTagsSortMode = () =>
  useUxSettingsStore((state) => state.tagsSortMode);

export const useGridMaxLanes = () =>
  useUxSettingsStore((state) => state.gridMaxLanes);

export const useGridExpandImages = () =>
  useUxSettingsStore((state) => state.gridExpandImages);

export const usePagesMaxColumns = () =>
  useUxSettingsStore((state) => state.pagesMaxColumns);

export const useRecentFilesLimit = () =>
  useUxSettingsStore((state) => state.recentFilesLimit);

export const useRecentFilesDays = () =>
  useUxSettingsStore((state) => state.recentFilesDays);

export const useUxSettingsActions = () =>
  useUxSettingsStore((state) => state.actions);
