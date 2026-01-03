import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

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

export type GalleryBaseWidthMode = "service" | "custom";

type GallerySettingsState = {
  minLanes: number;
  maxLanes: number;
  expandImages: boolean;
  showScrollBadge: boolean;
  enableContextMenu: boolean;
  baseWidthMode: GalleryBaseWidthMode;
  customBaseWidth: number;
  horizontalGap: number;
  verticalGap: number;
  reflowDuration: number;
  actions: {
    setLanesRange: (min: number, max: number) => void;
    setExpandImages: (expand: boolean) => void;
    setShowScrollBadge: (show: boolean) => void;
    setEnableContextMenu: (show: boolean) => void;
    setBaseWidthMode: (mode: GalleryBaseWidthMode) => void;
    setCustomBaseWidth: (width: number) => void;
    setHorizontalGap: (gap: number) => void;
    setVerticalGap: (gap: number) => void;
    setReflowDuration: (duration: number) => void;
    reset: () => void;
  };
};

const useGallerySettingsStore = create<GallerySettingsState>()(
  persist(
    (set, _get, store) => ({
      minLanes: MIN_GALLERY_LANES,
      maxLanes: MAX_GALLERY_LANES,
      expandImages: true,
      showScrollBadge: true,
      enableContextMenu: true,
      baseWidthMode: "service" as GalleryBaseWidthMode,
      customBaseWidth: DEFAULT_THUMBNAIL_SIZE,
      horizontalGap: DEFAULT_GALLERY_HORIZONTAL_GAP,
      verticalGap: DEFAULT_GALLERY_VERTICAL_GAP,
      reflowDuration: DEFAULT_GALLERY_REFLOW_DURATION,
      actions: {
        setLanesRange: (minLanes: number, maxLanes: number) =>
          set({ minLanes, maxLanes }),
        setExpandImages: (expandImages: boolean) => set({ expandImages }),
        setShowScrollBadge: (showScrollBadge: boolean) =>
          set({ showScrollBadge }),
        setEnableContextMenu: (enableContextMenu: boolean) =>
          set({ enableContextMenu }),
        setBaseWidthMode: (baseWidthMode: GalleryBaseWidthMode) =>
          set({ baseWidthMode }),
        setCustomBaseWidth: (customBaseWidth: number) =>
          set({ customBaseWidth }),
        setHorizontalGap: (horizontalGap: number) => set({ horizontalGap }),
        setVerticalGap: (verticalGap: number) => set({ verticalGap }),
        setReflowDuration: (reflowDuration: number) => set({ reflowDuration }),
        reset: () => set(store.getInitialState()),
      },
    }),
    {
      name: "hyaway-gallery-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useGalleryMinLanes = () =>
  useGallerySettingsStore((state) => state.minLanes);

export const useGalleryMaxLanes = () =>
  useGallerySettingsStore((state) => state.maxLanes);

export const useGalleryExpandImages = () =>
  useGallerySettingsStore((state) => state.expandImages);

export const useGalleryShowScrollBadge = () =>
  useGallerySettingsStore((state) => state.showScrollBadge);

export const useGalleryEnableContextMenu = () =>
  useGallerySettingsStore((state) => state.enableContextMenu);

export const useGalleryBaseWidthMode = () =>
  useGallerySettingsStore((state) => state.baseWidthMode);

export const useGalleryCustomBaseWidth = () =>
  useGallerySettingsStore((state) => state.customBaseWidth);

export const useGalleryHorizontalGap = () =>
  useGallerySettingsStore((state) => state.horizontalGap);

export const useGalleryVerticalGap = () =>
  useGallerySettingsStore((state) => state.verticalGap);

export const useGalleryReflowDuration = () =>
  useGallerySettingsStore((state) => state.reflowDuration);

export const useGallerySettingsActions = () =>
  useGallerySettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useGallerySettingsStore);
