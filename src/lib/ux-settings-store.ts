import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TagsSortMode = "count" | "namespace";

type UxSettingsState = {
  tagsSortMode: TagsSortMode;
  gridMaxLanes: number;
  gridExpandImages: boolean;
  actions: {
    setTagsSortMode: (mode: TagsSortMode) => void;
    setGridMaxLanes: (lanes: number) => void;
    setGridExpandImages: (expand: boolean) => void;
  };
};

export const useUxSettingsStore = create<UxSettingsState>()(
  persist(
    (set) => ({
      tagsSortMode: "count",
      gridMaxLanes: 8,
      gridExpandImages: true,
      actions: {
        setTagsSortMode: (tagsSortMode: TagsSortMode) => set({ tagsSortMode }),
        setGridMaxLanes: (gridMaxLanes: number) => set({ gridMaxLanes }),
        setGridExpandImages: (gridExpandImages: boolean) =>
          set({ gridExpandImages }),
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

export const useUxSettingsActions = () =>
  useUxSettingsStore((state) => state.actions);
