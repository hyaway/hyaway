import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

type ReviewSettingsState = {
  /** Enable keyboard shortcuts for review actions */
  shortcutsEnabled: boolean;
  /** Enable swipe gestures for review actions */
  gesturesEnabled: boolean;
  actions: {
    setShortcutsEnabled: (enabled: boolean) => void;
    setGesturesEnabled: (enabled: boolean) => void;
    reset: () => void;
  };
};

const defaultState = {
  shortcutsEnabled: true,
  gesturesEnabled: true,
};

const useReviewSettingsStore = create<ReviewSettingsState>()(
  persist(
    (set, _get, store) => ({
      ...defaultState,
      actions: {
        setShortcutsEnabled: (shortcutsEnabled: boolean) =>
          set({ shortcutsEnabled }),
        setGesturesEnabled: (gesturesEnabled: boolean) =>
          set({ gesturesEnabled }),
        reset: () => set(store.getInitialState()),
      },
    }),
    {
      name: "hyaway-review-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        shortcutsEnabled: state.shortcutsEnabled,
        gesturesEnabled: state.gesturesEnabled,
      }),
    },
  ),
);

// #region Selectors

/** Get shortcuts enabled setting */
export const useReviewShortcutsEnabled = () =>
  useReviewSettingsStore((state) => state.shortcutsEnabled);

/** Get gestures enabled setting */
export const useReviewGesturesEnabled = () =>
  useReviewSettingsStore((state) => state.gesturesEnabled);

/** Get settings actions */
export const useReviewSettingsActions = () =>
  useReviewSettingsStore((state) => state.actions);

// #endregion

// Sync settings across tabs
setupCrossTabSync(useReviewSettingsStore);
