import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export type ImageBackground = "solid" | "checkerboard" | "average";

type FileViewerSettingsState = {
  // Image settings
  startExpanded: boolean;
  imageBackground: ImageBackground;
  fillCanvasBackground: boolean;
  // Media settings (video/audio)
  mediaAutoPlay: boolean;
  mediaStartMuted: boolean;
  actions: {
    setStartExpanded: (expanded: boolean) => void;
    setImageBackground: (bg: ImageBackground) => void;
    setFillCanvasBackground: (fill: boolean) => void;
    setMediaAutoPlay: (autoplay: boolean) => void;
    setMediaStartMuted: (muted: boolean) => void;
    reset: () => void;
  };
};

const useFileViewerSettingsStore = create<FileViewerSettingsState>()(
  persist(
    (set, _get, store) => ({
      // Image settings
      startExpanded: false,
      imageBackground: "average",
      fillCanvasBackground: false,
      // Media settings (video/audio)
      mediaAutoPlay: true,
      mediaStartMuted: true,
      actions: {
        setStartExpanded: (startExpanded: boolean) => set({ startExpanded }),
        setImageBackground: (imageBackground: ImageBackground) =>
          set({ imageBackground }),
        setFillCanvasBackground: (fillCanvasBackground: boolean) =>
          set({ fillCanvasBackground }),
        setMediaAutoPlay: (mediaAutoPlay: boolean) => set({ mediaAutoPlay }),
        setMediaStartMuted: (mediaStartMuted: boolean) =>
          set({ mediaStartMuted }),
        reset: () => set(store.getInitialState()),
      },
    }),
    {
      name: "hyaway-file-viewer-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useFileViewerStartExpanded = () =>
  useFileViewerSettingsStore((state) => state.startExpanded);

export const useImageBackground = () =>
  useFileViewerSettingsStore((state) => state.imageBackground);

export const useFillCanvasBackground = () =>
  useFileViewerSettingsStore((state) => state.fillCanvasBackground);

export const useMediaAutoPlay = () =>
  useFileViewerSettingsStore((state) => state.mediaAutoPlay);

export const useMediaStartMuted = () =>
  useFileViewerSettingsStore((state) => state.mediaStartMuted);

export const useFileViewerSettingsActions = () =>
  useFileViewerSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useFileViewerSettingsStore);
