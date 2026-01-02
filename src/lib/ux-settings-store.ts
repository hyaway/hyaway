import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "./cross-tab-sync";

export const MAX_GRID_LANES = 30;
export const MAX_PAGES_COLUMNS = 30;
export const MAX_RECENT_FILES_LIMIT = 10000;
export const MAX_RECENT_FILES_DAYS = 30;
export const MAX_RANDOM_INBOX_LIMIT = 1000;

export type TagsSortMode = "count" | "namespace";
export type ImageBackground = "solid" | "checkerboard";

type UxSettingsState = {
  tagsSortMode: TagsSortMode;
  gridMaxLanes: number;
  gridExpandImages: boolean;
  gridShowScrollBadge: boolean;
  pagesMaxColumns: number;
  pagesShowScrollBadge: boolean;
  recentFilesLimit: number;
  recentFilesDays: number;
  randomInboxLimit: number;
  fileViewerStartExpanded: boolean;
  imageBackground: ImageBackground;
  actions: {
    setTagsSortMode: (mode: TagsSortMode) => void;
    setGridMaxLanes: (lanes: number) => void;
    setGridExpandImages: (expand: boolean) => void;
    setGridShowScrollBadge: (show: boolean) => void;
    setPagesMaxColumns: (columns: number) => void;
    setPagesShowScrollBadge: (show: boolean) => void;
    setRecentFilesLimit: (limit: number) => void;
    setRecentFilesDays: (days: number) => void;
    setRandomInboxLimit: (limit: number) => void;
    setFileViewerStartExpanded: (expanded: boolean) => void;
    setImageBackground: (bg: ImageBackground) => void;
  };
};

export const useUxSettingsStore = create<UxSettingsState>()(
  persist(
    (set) => ({
      tagsSortMode: "count",
      gridMaxLanes: MAX_GRID_LANES,
      gridExpandImages: true,
      gridShowScrollBadge: true,
      pagesMaxColumns: MAX_PAGES_COLUMNS,
      pagesShowScrollBadge: true,
      recentFilesLimit: 100,
      recentFilesDays: 3,
      randomInboxLimit: 100,
      fileViewerStartExpanded: false,
      imageBackground: "checkerboard",
      actions: {
        setTagsSortMode: (tagsSortMode: TagsSortMode) => set({ tagsSortMode }),
        setGridMaxLanes: (gridMaxLanes: number) => set({ gridMaxLanes }),
        setGridExpandImages: (gridExpandImages: boolean) =>
          set({ gridExpandImages }),
        setGridShowScrollBadge: (gridShowScrollBadge: boolean) =>
          set({ gridShowScrollBadge }),
        setPagesMaxColumns: (pagesMaxColumns: number) =>
          set({ pagesMaxColumns }),
        setPagesShowScrollBadge: (pagesShowScrollBadge: boolean) =>
          set({ pagesShowScrollBadge }),
        setRecentFilesLimit: (recentFilesLimit: number) =>
          set({ recentFilesLimit }),
        setRecentFilesDays: (recentFilesDays: number) =>
          set({ recentFilesDays }),
        setRandomInboxLimit: (randomInboxLimit: number) =>
          set({ randomInboxLimit }),
        setFileViewerStartExpanded: (fileViewerStartExpanded: boolean) =>
          set({ fileViewerStartExpanded }),
        setImageBackground: (imageBackground: ImageBackground) =>
          set({ imageBackground }),
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

export const useGridShowScrollBadge = () =>
  useUxSettingsStore((state) => state.gridShowScrollBadge);

export const usePagesMaxColumns = () =>
  useUxSettingsStore((state) => state.pagesMaxColumns);

export const usePagesShowScrollBadge = () =>
  useUxSettingsStore((state) => state.pagesShowScrollBadge);

export const useRecentFilesLimit = () =>
  useUxSettingsStore((state) => state.recentFilesLimit);

export const useRecentFilesDays = () =>
  useUxSettingsStore((state) => state.recentFilesDays);

export const useRandomInboxLimit = () =>
  useUxSettingsStore((state) => state.randomInboxLimit);

export const useFileViewerStartExpanded = () =>
  useUxSettingsStore((state) => state.fileViewerStartExpanded);

export const useImageBackground = () =>
  useUxSettingsStore((state) => state.imageBackground);

export const useUxSettingsActions = () =>
  useUxSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useUxSettingsStore);
