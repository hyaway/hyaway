import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export type ImageBackground = "solid" | "checkerboard" | "average";

type FileViewerSettingsState = {
  startExpanded: boolean;
  imageBackground: ImageBackground;
  actions: {
    setStartExpanded: (expanded: boolean) => void;
    setImageBackground: (bg: ImageBackground) => void;
    reset: () => void;
  };
};

const useFileViewerSettingsStore = create<FileViewerSettingsState>()(
  persist(
    (set, _get, store) => ({
      startExpanded: false,
      imageBackground: "average",
      actions: {
        setStartExpanded: (startExpanded: boolean) => set({ startExpanded }),
        setImageBackground: (imageBackground: ImageBackground) =>
          set({ imageBackground }),
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

export const useFileViewerSettingsActions = () =>
  useFileViewerSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useFileViewerSettingsStore);
