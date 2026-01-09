import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export const MAX_PAGES_COLUMNS = 30;

type PagesSettingsState = {
  maxColumns: number;
  showScrollBadge: boolean;
  useFriendlyUrls: boolean;
  actions: {
    setMaxColumns: (columns: number) => void;
    setShowScrollBadge: (show: boolean) => void;
    setUseFriendlyUrls: (use: boolean) => void;
    reset: () => void;
  };
};

const usePagesSettingsStore = create<PagesSettingsState>()(
  persist(
    (set, _get, store) => ({
      maxColumns: MAX_PAGES_COLUMNS,
      showScrollBadge: true,
      useFriendlyUrls: true,
      actions: {
        setMaxColumns: (maxColumns: number) => set({ maxColumns }),
        setShowScrollBadge: (showScrollBadge: boolean) =>
          set({ showScrollBadge }),
        setUseFriendlyUrls: (useFriendlyUrls: boolean) =>
          set({ useFriendlyUrls }),
        reset: () => set(store.getInitialState()),
      },
    }),
    {
      name: "hyaway-pages-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const usePagesMaxColumns = () =>
  usePagesSettingsStore((state) => state.maxColumns);

export const usePagesShowScrollBadge = () =>
  usePagesSettingsStore((state) => state.showScrollBadge);

export const usePagesUseFriendlyUrls = () =>
  usePagesSettingsStore((state) => state.useFriendlyUrls);

export const usePagesSettingsActions = () =>
  usePagesSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(usePagesSettingsStore);
