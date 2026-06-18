// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

type SendToPageStoreState = {
  /** Target Hydrus page key (null = unset) */
  pageKey: string | null;
  /** Cached page name, for display and closed-page warnings */
  pageName: string | null;

  actions: {
    /** Set the target page (key + name for display) */
    setSendToPage: (pageKey: string, pageName: string) => void;
    /** Clear the target page */
    clearSendToPage: () => void;
  };
};

const useSendToPageStore = create<SendToPageStoreState>()(
  persist(
    (set) => ({
      pageKey: null,
      pageName: null,
      actions: {
        setSendToPage: (pageKey, pageName) => set({ pageKey, pageName }),
        clearSendToPage: () => set({ pageKey: null, pageName: null }),
      },
    }),
    {
      name: "hyaway-send-to-page",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pageKey: state.pageKey,
        pageName: state.pageName,
      }),
    },
  ),
);

// Sync the target across tabs
setupCrossTabSync(useSendToPageStore);

/** Configured target page key (null when unset). */
export const useSendToPageKey = () =>
  useSendToPageStore((state) => state.pageKey);

/** Cached name of the configured target page (null when unset). */
export const useSendToPageName = () =>
  useSendToPageStore((state) => state.pageName);

/** Store actions for the send-to-page target. */
export const useSendToPageActions = () =>
  useSendToPageStore((state) => state.actions);
