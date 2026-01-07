import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export type ImageBackground = "solid" | "checkerboard" | "average";

type FileViewerSettingsState = {
  // Image settings
  startExpanded: boolean;
  imageBackground: ImageBackground;
  fillCanvasBackground: boolean;
  // Video settings
  videoStartExpanded: boolean;
  // Media settings (video/audio)
  mediaAutoPlay: boolean;
  mediaStartWithSound: boolean;
  actions: {
    setStartExpanded: (expanded: boolean) => void;
    setImageBackground: (bg: ImageBackground) => void;
    setFillCanvasBackground: (fill: boolean) => void;
    setVideoStartExpanded: (expanded: boolean) => void;
    setMediaAutoPlay: (autoplay: boolean) => void;
    setMediaStartWithSound: (withSound: boolean) => void;
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
      // Video settings
      videoStartExpanded: false,
      // Media settings (video/audio)
      mediaAutoPlay: true,
      mediaStartWithSound: false,
      actions: {
        setStartExpanded: (startExpanded: boolean) => set({ startExpanded }),
        setImageBackground: (imageBackground: ImageBackground) =>
          set({ imageBackground }),
        setFillCanvasBackground: (fillCanvasBackground: boolean) =>
          set({ fillCanvasBackground }),
        setVideoStartExpanded: (videoStartExpanded: boolean) =>
          set({ videoStartExpanded }),
        setMediaAutoPlay: (mediaAutoPlay: boolean) => set({ mediaAutoPlay }),
        setMediaStartWithSound: (mediaStartWithSound: boolean) =>
          set({ mediaStartWithSound }),
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

export const useVideoStartExpanded = () =>
  useFileViewerSettingsStore((state) => state.videoStartExpanded);

export const useMediaAutoPlay = () =>
  useFileViewerSettingsStore((state) => state.mediaAutoPlay);

export const useMediaStartWithSound = () =>
  useFileViewerSettingsStore((state) => state.mediaStartWithSound);

export const useFileViewerSettingsActions = () =>
  useFileViewerSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useFileViewerSettingsStore);
