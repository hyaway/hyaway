import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const MAX_GRID_LANES = 30;
export const MAX_PAGES_COLUMNS = 30;

export type TagsSortMode = "count" | "namespace";

type UxSettingsState = {
  tagsSortMode: TagsSortMode;
  gridMaxLanes: number;
  gridExpandImages: boolean;
  pagesMaxColumns: number;
  actions: {
    setTagsSortMode: (mode: TagsSortMode) => void;
    setGridMaxLanes: (lanes: number) => void;
    setGridExpandImages: (expand: boolean) => void;
    setPagesMaxColumns: (columns: number) => void;
  };
};

export const useUxSettingsStore = create<UxSettingsState>()(
  persist(
    (set) => ({
      tagsSortMode: "count",
      gridMaxLanes: MAX_GRID_LANES,
      gridExpandImages: true,
      pagesMaxColumns: MAX_PAGES_COLUMNS,
      actions: {
        setTagsSortMode: (tagsSortMode: TagsSortMode) => set({ tagsSortMode }),
        setGridMaxLanes: (gridMaxLanes: number) => set({ gridMaxLanes }),
        setGridExpandImages: (gridExpandImages: boolean) =>
          set({ gridExpandImages }),
        setPagesMaxColumns: (pagesMaxColumns: number) =>
          set({ pagesMaxColumns }),
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

export const useUxSettingsActions = () =>
  useUxSettingsStore((state) => state.actions);
