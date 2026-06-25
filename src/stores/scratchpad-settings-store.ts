// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export const DEFAULT_SCRATCHPAD_PAGE_NAME = "scratchpad";
export const DEFAULT_SCRATCHPAD_HIDE_SENT_FILES = true;
export const SCRATCHPAD_PAGE_LOCATION_VALUES = ["hyaway", "root"] as const;
export type ScratchpadPageLocation =
  (typeof SCRATCHPAD_PAGE_LOCATION_VALUES)[number];
export const DEFAULT_SCRATCHPAD_PAGE_LOCATION: ScratchpadPageLocation =
  "hyaway";

type ScratchpadSettingsState = {
  scratchpadPageLocation: ScratchpadPageLocation;
  scratchpadPageName: string;
  scratchpadHideSentFiles: boolean;
  actions: {
    setScratchpadPageLocation: (location: ScratchpadPageLocation) => void;
    setScratchpadPageName: (name: string) => void;
    setScratchpadHideSentFiles: (hide: boolean) => void;
    reset: () => void;
  };
};

const useScratchpadSettingsStore = create<ScratchpadSettingsState>()(
  persist(
    (set, _get, store) => ({
      scratchpadPageLocation: DEFAULT_SCRATCHPAD_PAGE_LOCATION,
      scratchpadPageName: DEFAULT_SCRATCHPAD_PAGE_NAME,
      scratchpadHideSentFiles: DEFAULT_SCRATCHPAD_HIDE_SENT_FILES,
      actions: {
        setScratchpadPageLocation: (
          scratchpadPageLocation: ScratchpadPageLocation,
        ) => set({ scratchpadPageLocation }),
        setScratchpadPageName: (scratchpadPageName: string) =>
          set({ scratchpadPageName }),
        setScratchpadHideSentFiles: (scratchpadHideSentFiles: boolean) =>
          set({ scratchpadHideSentFiles }),
        reset: () => set(store.getInitialState()),
      },
    }),
    {
      name: "hyaway-scratchpad-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useScratchpadPageName = () =>
  useScratchpadSettingsStore((state) => state.scratchpadPageName);

export const useScratchpadPageLocation = () =>
  useScratchpadSettingsStore((state) => state.scratchpadPageLocation);

export const useScratchpadHideSentFiles = () =>
  useScratchpadSettingsStore((state) => state.scratchpadHideSentFiles);

export const getScratchpadPageLocation = () =>
  useScratchpadSettingsStore.getState().scratchpadPageLocation;

export const getScratchpadPageName = () => {
  const name = useScratchpadSettingsStore.getState().scratchpadPageName.trim();
  return name || DEFAULT_SCRATCHPAD_PAGE_NAME;
};

export const useScratchpadSettingsActions = () =>
  useScratchpadSettingsStore((state) => state.actions);

setupCrossTabSync(useScratchpadSettingsStore);
