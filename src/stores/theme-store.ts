import { useEffect, useLayoutEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

// Match existing Theme type used by ThemeProvider for consistency.
export type ActiveTheme = "dark" | "light";
export type Theme = "dark" | "light" | "system";

type ThemeState = {
  activeTheme: ActiveTheme;
  themePreference: Theme;
  _hasHydrated: boolean;
  actions: {
    setActiveTheme: (theme: ActiveTheme) => void;
    setThemePreference: (theme: Theme) => void;
    resetSystemTheme: () => void;
    setHasHydrated: (state: boolean) => void;
  };
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      activeTheme: getWindowSystemTheme(),
      themePreference: "system",
      _hasHydrated: false,
      actions: {
        setActiveTheme: (activeTheme: ActiveTheme) => set({ activeTheme }),
        setThemePreference: (themePreference: Theme) => {
          if (themePreference === "system") {
            set({ themePreference, activeTheme: getWindowSystemTheme() });
          } else {
            set({ themePreference, activeTheme: themePreference });
          }
        },
        resetSystemTheme: () =>
          set((state) => {
            if (state.themePreference === "system") {
              return { activeTheme: getWindowSystemTheme() };
            }
            return {};
          }),
        setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      },
    }),
    {
      name: "hyaway-theme-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, _hasHydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.actions.setHasHydrated(true);
      },
    },
  ),
);

export function getWindowSystemTheme(): ActiveTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const getActiveThemeSnapshot = () =>
  useThemeStore.getState().activeTheme;
export const getThemePreferenceSnapshot = () =>
  useThemeStore.getState().themePreference;
export const getThemeActionsSnapshot = () => useThemeStore.getState().actions;

export const useActiveTheme = () => useThemeStore((state) => state.activeTheme);
export const useThemePreference = () =>
  useThemeStore((state) => state.themePreference);
export const useThemeActions = () => useThemeStore((state) => state.actions);
export const useThemeHydrated = () =>
  useThemeStore((state) => state._hasHydrated);

function applyTheme(theme: ActiveTheme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function useSystemThemeListener() {
  const { resetSystemTheme } = useThemeActions();
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", resetSystemTheme);
    return () => {
      mediaQuery.removeEventListener("change", resetSystemTheme);
    };
  }, [resetSystemTheme]);
}

export function useApplyTheme() {
  const activeTheme = useActiveTheme();
  useLayoutEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);
}

// Sync theme across tabs
setupCrossTabSync(useThemeStore);
