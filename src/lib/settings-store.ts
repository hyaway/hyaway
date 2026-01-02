import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "./cross-tab-sync";

export const MAX_GALLERY_LANES = 30;
export const MAX_PAGES_COLUMNS = 30;
export const MAX_RECENT_FILES_LIMIT = 10000;
export const MAX_RECENT_FILES_DAYS = 30;
export const MAX_RANDOM_INBOX_LIMIT = 1000;

export type TagsSortMode = "count" | "namespace";
export type ImageBackground = "solid" | "checkerboard";

type UxSettingsState = {
  tagsSortMode: TagsSortMode;
  galleryMaxLanes: number;
  galleryExpandImages: boolean;
  galleryShowScrollBadge: boolean;
  pagesMaxColumns: number;
  pagesShowScrollBadge: boolean;
  recentFilesLimit: number;
  recentFilesDays: number;
  randomInboxLimit: number;
  fileViewerStartExpanded: boolean;
  imageBackground: ImageBackground;
  actions: {
    setTagsSortMode: (mode: TagsSortMode) => void;
    setGalleryMaxLanes: (lanes: number) => void;
    setGalleryExpandImages: (expand: boolean) => void;
    setGalleryShowScrollBadge: (show: boolean) => void;
    setPagesMaxColumns: (columns: number) => void;
    setPagesShowScrollBadge: (show: boolean) => void;
    setRecentFilesLimit: (limit: number) => void;
    setRecentFilesDays: (days: number) => void;
    setRandomInboxLimit: (limit: number) => void;
    setFileViewerStartExpanded: (expanded: boolean) => void;
    setImageBackground: (bg: ImageBackground) => void;
  };
};

const useSettingsStore = create<UxSettingsState>()(
  persist(
    (set) => ({
      tagsSortMode: "count",
      galleryMaxLanes: MAX_GALLERY_LANES,
      galleryExpandImages: true,
      galleryShowScrollBadge: true,
      pagesMaxColumns: MAX_PAGES_COLUMNS,
      pagesShowScrollBadge: true,
      recentFilesLimit: 100,
      recentFilesDays: 3,
      randomInboxLimit: 100,
      fileViewerStartExpanded: false,
      imageBackground: "checkerboard",
      actions: {
        setTagsSortMode: (tagsSortMode: TagsSortMode) => set({ tagsSortMode }),
        setGalleryMaxLanes: (galleryMaxLanes: number) =>
          set({ galleryMaxLanes }),
        setGalleryExpandImages: (galleryExpandImages: boolean) =>
          set({ galleryExpandImages }),
        setGalleryShowScrollBadge: (galleryShowScrollBadge: boolean) =>
          set({ galleryShowScrollBadge }),
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
      name: "settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useTagsSortMode = () =>
  useSettingsStore((state) => state.tagsSortMode);

export const useGalleryMaxLanes = () =>
  useSettingsStore((state) => state.galleryMaxLanes);

export const useGalleryExpandImages = () =>
  useSettingsStore((state) => state.galleryExpandImages);

export const useGalleryShowScrollBadge = () =>
  useSettingsStore((state) => state.galleryShowScrollBadge);

export const usePagesMaxColumns = () =>
  useSettingsStore((state) => state.pagesMaxColumns);

export const usePagesShowScrollBadge = () =>
  useSettingsStore((state) => state.pagesShowScrollBadge);

export const useRecentFilesLimit = () =>
  useSettingsStore((state) => state.recentFilesLimit);

export const useRecentFilesDays = () =>
  useSettingsStore((state) => state.recentFilesDays);

export const useRandomInboxLimit = () =>
  useSettingsStore((state) => state.randomInboxLimit);

export const useFileViewerStartExpanded = () =>
  useSettingsStore((state) => state.fileViewerStartExpanded);

export const useImageBackground = () =>
  useSettingsStore((state) => state.imageBackground);

export const useUxSettingsActions = () =>
  useSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useSettingsStore);
