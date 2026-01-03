import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export const MAX_PAGES_COLUMNS = 30;

type PagesSettingsState = {
  maxColumns: number;
  showScrollBadge: boolean;
  actions: {
    setMaxColumns: (columns: number) => void;
    setShowScrollBadge: (show: boolean) => void;
  };
};

const usePagesSettingsStore = create<PagesSettingsState>()(
  persist(
    (set) => ({
      maxColumns: MAX_PAGES_COLUMNS,
      showScrollBadge: true,
      actions: {
        setMaxColumns: (maxColumns: number) => set({ maxColumns }),
        setShowScrollBadge: (showScrollBadge: boolean) =>
          set({ showScrollBadge }),
      },
    }),
    {
      name: "pages-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const usePagesMaxColumns = () =>
  usePagesSettingsStore((state) => state.maxColumns);

export const usePagesShowScrollBadge = () =>
  usePagesSettingsStore((state) => state.showScrollBadge);

export const usePagesSettingsActions = () =>
  usePagesSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(usePagesSettingsStore);
