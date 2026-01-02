import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSelectors } from "./create-selectors";
import { setupCrossTabSync } from "./cross-tab-sync";

// ============================================================================
// Constants
// ============================================================================

export const MAX_GALLERY_LANES = 30;
export const MAX_PAGES_COLUMNS = 30;
export const MAX_RECENT_FILES_LIMIT = 10000;
export const MAX_RECENT_FILES_DAYS = 30;
export const MAX_RANDOM_INBOX_LIMIT = 1000;

// ============================================================================
// Types
// ============================================================================

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

const useUxSettingsStoreBase = create<UxSettingsState>()(
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
        setTagsSortMode: (tagsSortMode) => set({ tagsSortMode }),
        setGalleryMaxLanes: (galleryMaxLanes) => set({ galleryMaxLanes }),
        setGalleryExpandImages: (galleryExpandImages) =>
          set({ galleryExpandImages }),
        setGalleryShowScrollBadge: (galleryShowScrollBadge) =>
          set({ galleryShowScrollBadge }),
        setPagesMaxColumns: (pagesMaxColumns) => set({ pagesMaxColumns }),
        setPagesShowScrollBadge: (pagesShowScrollBadge) =>
          set({ pagesShowScrollBadge }),
        setRecentFilesLimit: (recentFilesLimit) => set({ recentFilesLimit }),
        setRecentFilesDays: (recentFilesDays) => set({ recentFilesDays }),
        setRandomInboxLimit: (randomInboxLimit) => set({ randomInboxLimit }),
        setFileViewerStartExpanded: (fileViewerStartExpanded) =>
          set({ fileViewerStartExpanded }),
        setImageBackground: (imageBackground) => set({ imageBackground }),
      },
    }),
    {
      name: "ux-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

/**
 * UX Settings store with auto-generated selectors.
 *
 * @example
 * ```tsx
 * // Use auto-generated selectors
 * const tagsSortMode = useUxSettingsStore.use.tagsSortMode();
 * const { setGalleryMaxLanes } = useUxSettingsStore.use.actions();
 *
 * // Or use direct selector
 * const lanes = useUxSettingsStore((s) => s.galleryMaxLanes);
 * ```
 */
export const useUxSettingsStore = createSelectors(useUxSettingsStoreBase);

// Sync settings across tabs
setupCrossTabSync(useUxSettingsStore);

// ============================================================================
// Legacy selector exports (for backward compatibility)
// ============================================================================

/** @deprecated Use `useUxSettingsStore.use.tagsSortMode()` */
export const useTagsSortMode = () =>
  useUxSettingsStore((state) => state.tagsSortMode);

/** @deprecated Use `useUxSettingsStore.use.galleryMaxLanes()` */
export const useGalleryMaxLanes = () =>
  useUxSettingsStore((state) => state.galleryMaxLanes);

/** @deprecated Use `useUxSettingsStore.use.galleryExpandImages()` */
export const useGalleryExpandImages = () =>
  useUxSettingsStore((state) => state.galleryExpandImages);

/** @deprecated Use `useUxSettingsStore.use.galleryShowScrollBadge()` */
export const useGalleryShowScrollBadge = () =>
  useUxSettingsStore((state) => state.galleryShowScrollBadge);

/** @deprecated Use `useUxSettingsStore.use.pagesMaxColumns()` */
export const usePagesMaxColumns = () =>
  useUxSettingsStore((state) => state.pagesMaxColumns);

/** @deprecated Use `useUxSettingsStore.use.pagesShowScrollBadge()` */
export const usePagesShowScrollBadge = () =>
  useUxSettingsStore((state) => state.pagesShowScrollBadge);

/** @deprecated Use `useUxSettingsStore.use.recentFilesLimit()` */
export const useRecentFilesLimit = () =>
  useUxSettingsStore((state) => state.recentFilesLimit);

/** @deprecated Use `useUxSettingsStore.use.recentFilesDays()` */
export const useRecentFilesDays = () =>
  useUxSettingsStore((state) => state.recentFilesDays);

/** @deprecated Use `useUxSettingsStore.use.randomInboxLimit()` */
export const useRandomInboxLimit = () =>
  useUxSettingsStore((state) => state.randomInboxLimit);

/** @deprecated Use `useUxSettingsStore.use.fileViewerStartExpanded()` */
export const useFileViewerStartExpanded = () =>
  useUxSettingsStore((state) => state.fileViewerStartExpanded);

/** @deprecated Use `useUxSettingsStore.use.imageBackground()` */
export const useImageBackground = () =>
  useUxSettingsStore((state) => state.imageBackground);

/** @deprecated Use `useUxSettingsStore.use.actions()` */
export const useUxSettingsActions = () =>
  useUxSettingsStore((state) => state.actions);
