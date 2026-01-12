import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export const MIN_PAGES_LANES = 1;
export const MAX_PAGES_LANES = 30;

// Page card sizing constants - maintains 5:4 aspect ratio
export const DEFAULT_PAGE_CARD_WIDTH = 192; // 12rem
export const MIN_PAGE_CARD_WIDTH = 120;
export const MAX_PAGE_CARD_WIDTH = 320;
export const PAGE_CARD_ASPECT_RATIO = 1.25; // height = width * 1.25

// Gap constants
export const DEFAULT_PAGE_CARD_HORIZONTAL_GAP = 16;
export const DEFAULT_PAGE_CARD_VERTICAL_GAP = 16;
export const MAX_PAGE_CARD_GAP = 32;

type PagesSettingsState = {
  minLanes: number;
  maxLanes: number;
  showScrollBadge: boolean;
  useFriendlyUrls: boolean;
  cardWidth: number;
  horizontalGap: number;
  verticalGap: number;
  expandCards: boolean;
  lastOpenSection: string;
  actions: {
    setLanesRange: (min: number, max: number) => void;
    setShowScrollBadge: (show: boolean) => void;
    setUseFriendlyUrls: (use: boolean) => void;
    setCardWidth: (width: number) => void;
    setHorizontalGap: (gap: number) => void;
    setVerticalGap: (gap: number) => void;
    setExpandCards: (expand: boolean) => void;
    setLastOpenSection: (section: string) => void;
    reset: () => void;
  };
};

const usePagesSettingsStore = create<PagesSettingsState>()(
  persist(
    (set, _get, store) => ({
      minLanes: MIN_PAGES_LANES,
      maxLanes: MAX_PAGES_LANES,
      showScrollBadge: true,
      useFriendlyUrls: true,
      cardWidth: DEFAULT_PAGE_CARD_WIDTH,
      horizontalGap: DEFAULT_PAGE_CARD_HORIZONTAL_GAP,
      verticalGap: DEFAULT_PAGE_CARD_VERTICAL_GAP,
      expandCards: false,
      lastOpenSection: "layout",
      actions: {
        setLanesRange: (minLanes: number, maxLanes: number) =>
          set({ minLanes, maxLanes }),
        setShowScrollBadge: (showScrollBadge: boolean) =>
          set({ showScrollBadge }),
        setUseFriendlyUrls: (useFriendlyUrls: boolean) =>
          set({ useFriendlyUrls }),
        setCardWidth: (cardWidth: number) => set({ cardWidth }),
        setHorizontalGap: (horizontalGap: number) => set({ horizontalGap }),
        setVerticalGap: (verticalGap: number) => set({ verticalGap }),
        setExpandCards: (expandCards: boolean) => set({ expandCards }),
        setLastOpenSection: (lastOpenSection: string) =>
          set({ lastOpenSection }),
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

export const usePagesMinLanes = () =>
  usePagesSettingsStore((state) => state.minLanes);

export const usePagesMaxLanes = () =>
  usePagesSettingsStore((state) => state.maxLanes);

export const usePagesShowScrollBadge = () =>
  usePagesSettingsStore((state) => state.showScrollBadge);

export const usePagesUseFriendlyUrls = () =>
  usePagesSettingsStore((state) => state.useFriendlyUrls);

export const usePagesCardWidth = () =>
  usePagesSettingsStore((state) => state.cardWidth);

export const usePagesHorizontalGap = () =>
  usePagesSettingsStore((state) => state.horizontalGap);

export const usePagesVerticalGap = () =>
  usePagesSettingsStore((state) => state.verticalGap);

export const usePagesExpandCards = () =>
  usePagesSettingsStore((state) => state.expandCards);

export const usePagesLastOpenSection = () =>
  usePagesSettingsStore((state) => state.lastOpenSection);

export const usePagesSettingsActions = () =>
  usePagesSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(usePagesSettingsStore);
