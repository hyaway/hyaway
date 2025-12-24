import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TagsSortMode = "count" | "namespace";

type UxSettingsState = {
  tagsSortMode: TagsSortMode;
  actions: {
    setTagsSortMode: (mode: TagsSortMode) => void;
  };
};

export const useUxSettingsStore = create<UxSettingsState>()(
  persist(
    (set) => ({
      tagsSortMode: "count",
      actions: {
        setTagsSortMode: (tagsSortMode: TagsSortMode) => set({ tagsSortMode }),
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

export const useUxSettingsActions = () =>
  useUxSettingsStore((state) => state.actions);
