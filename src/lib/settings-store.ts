import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "./cross-tab-sync";

export const MAX_GALLERY_LANES = 30;
export const MIN_GALLERY_LANES = 1;
export const DEFAULT_GALLERY_HORIZONTAL_GAP = 8;
export const DEFAULT_GALLERY_VERTICAL_GAP = 8;
export const MAX_GALLERY_GAP = 32;
export const DEFAULT_THUMBNAIL_SIZE = 200;
export const MIN_GALLERY_BASE_WIDTH = 100;
export const MAX_GALLERY_BASE_WIDTH = 500;
export const DEFAULT_GALLERY_REFLOW_DURATION = 350;
export const MAX_GALLERY_REFLOW_DURATION = 1000;
export const MAX_PAGES_COLUMNS = 30;
export const MAX_RECENT_FILES_LIMIT = 10000;
export const MAX_RECENT_FILES_DAYS = 30;
export const MAX_RANDOM_INBOX_LIMIT = 1000;

export type TagsSortMode = "count" | "namespace";
export type ImageBackground = "solid" | "checkerboard";
export type GalleryBaseWidthMode = "service" | "custom";

type UxSettingsState = {
  tagsSortMode: TagsSortMode;
  galleryMinLanes: number;
  galleryMaxLanes: number;
  galleryExpandImages: boolean;
  galleryShowScrollBadge: boolean;
  galleryBaseWidthMode: GalleryBaseWidthMode;
  galleryCustomBaseWidth: number;
  galleryHorizontalGap: number;
  galleryVerticalGap: number;
  galleryReflowDuration: number;
  pagesMaxColumns: number;
  pagesShowScrollBadge: boolean;
  recentFilesLimit: number;
  recentFilesDays: number;
  randomInboxLimit: number;
  fileViewerStartExpanded: boolean;
  imageBackground: ImageBackground;
  actions: {
    setTagsSortMode: (mode: TagsSortMode) => void;
    setGalleryLanesRange: (min: number, max: number) => void;
    setGalleryExpandImages: (expand: boolean) => void;
    setGalleryShowScrollBadge: (show: boolean) => void;
    setGalleryBaseWidthMode: (mode: GalleryBaseWidthMode) => void;
    setGalleryCustomBaseWidth: (width: number) => void;
    setGalleryHorizontalGap: (gap: number) => void;
    setGalleryVerticalGap: (gap: number) => void;
    setGalleryReflowDuration: (duration: number) => void;
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
      galleryMinLanes: MIN_GALLERY_LANES,
      galleryMaxLanes: MAX_GALLERY_LANES,
      galleryExpandImages: true,
      galleryShowScrollBadge: true,
      galleryBaseWidthMode: "service" as GalleryBaseWidthMode,
      galleryCustomBaseWidth: DEFAULT_THUMBNAIL_SIZE,
      galleryHorizontalGap: DEFAULT_GALLERY_HORIZONTAL_GAP,
      galleryVerticalGap: DEFAULT_GALLERY_VERTICAL_GAP,
      galleryReflowDuration: DEFAULT_GALLERY_REFLOW_DURATION,
      pagesMaxColumns: MAX_PAGES_COLUMNS,
      pagesShowScrollBadge: true,
      recentFilesLimit: 100,
      recentFilesDays: 3,
      randomInboxLimit: 100,
      fileViewerStartExpanded: false,
      imageBackground: "checkerboard",
      actions: {
        setTagsSortMode: (tagsSortMode: TagsSortMode) => set({ tagsSortMode }),
        setGalleryLanesRange: (
          galleryMinLanes: number,
          galleryMaxLanes: number,
        ) => set({ galleryMinLanes, galleryMaxLanes }),
        setGalleryExpandImages: (galleryExpandImages: boolean) =>
          set({ galleryExpandImages }),
        setGalleryShowScrollBadge: (galleryShowScrollBadge: boolean) =>
          set({ galleryShowScrollBadge }),
        setGalleryBaseWidthMode: (galleryBaseWidthMode: GalleryBaseWidthMode) =>
          set({ galleryBaseWidthMode }),
        setGalleryCustomBaseWidth: (galleryCustomBaseWidth: number) =>
          set({ galleryCustomBaseWidth }),
        setGalleryHorizontalGap: (galleryHorizontalGap: number) =>
          set({ galleryHorizontalGap }),
        setGalleryVerticalGap: (galleryVerticalGap: number) =>
          set({ galleryVerticalGap }),
        setGalleryReflowDuration: (galleryReflowDuration: number) =>
          set({ galleryReflowDuration }),
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

export const useGalleryMinLanes = () =>
  useSettingsStore((state) => state.galleryMinLanes);

export const useGalleryMaxLanes = () =>
  useSettingsStore((state) => state.galleryMaxLanes);

export const useGalleryExpandImages = () =>
  useSettingsStore((state) => state.galleryExpandImages);

export const useGalleryShowScrollBadge = () =>
  useSettingsStore((state) => state.galleryShowScrollBadge);

export const useGalleryBaseWidthMode = () =>
  useSettingsStore((state) => state.galleryBaseWidthMode);

export const useGalleryCustomBaseWidth = () =>
  useSettingsStore((state) => state.galleryCustomBaseWidth);

export const useGalleryHorizontalGap = () =>
  useSettingsStore((state) => state.galleryHorizontalGap);

export const useGalleryVerticalGap = () =>
  useSettingsStore((state) => state.galleryVerticalGap);

export const useGalleryReflowDuration = () =>
  useSettingsStore((state) => state.galleryReflowDuration);

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

export const useSettingsActions = () =>
  useSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useSettingsStore);
