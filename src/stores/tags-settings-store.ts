// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export type TagsSortMode = "count" | "namespace";

type TagsSettingsState = {
  sortMode: TagsSortMode;
  actions: {
    setSortMode: (mode: TagsSortMode) => void;
    reset: () => void;
  };
};

const useTagsSettingsStore = create<TagsSettingsState>()(
  persist(
    (set, _get, store) => ({
      sortMode: "count",
      actions: {
        setSortMode: (sortMode: TagsSortMode) => set({ sortMode }),
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

export const useTagsSettingsActions = () =>
  useTagsSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useTagsSettingsStore);
