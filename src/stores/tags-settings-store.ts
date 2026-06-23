// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export type TagsSortMode = "count" | "namespace";
export type FileTagsSortMode = "hydrus" | "namespace";

type TagsSettingsState = {
  sortMode: TagsSortMode;
  fileSortMode: FileTagsSortMode;
  actions: {
    setSortMode: (mode: TagsSortMode) => void;
    setFileSortMode: (mode: FileTagsSortMode) => void;
    reset: () => void;
  };
};

const useTagsSettingsStore = create<TagsSettingsState>()(
  persist(
    (set, _get, store) => ({
      sortMode: "count",
      fileSortMode: "namespace",
      actions: {
        setSortMode: (sortMode: TagsSortMode) => set({ sortMode }),
        setFileSortMode: (fileSortMode: FileTagsSortMode) =>
          set({ fileSortMode }),
        reset: () => set(store.getInitialState()),
      },
    }),
    {
      name: "hyaway-tags-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useTagsSortMode = () =>
  useTagsSettingsStore((state) => state.sortMode);

export const useFileTagsSortMode = () =>
  useTagsSettingsStore((state) => state.fileSortMode);

export const useTagsSettingsActions = () =>
  useTagsSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useTagsSettingsStore);
