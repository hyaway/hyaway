import { useLayoutEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Match existing Theme type used by ThemeProvider for consistency.
export type ActiveTheme = "dark" | "light";
export type Theme = "dark" | "light" | "system";

type ThemeState = {
  activeTheme: ActiveTheme;
  themePreference: Theme;
  actions: {
    setActiveTheme: (theme: ActiveTheme) => void;
    setThemePreference: (theme: Theme) => void;
  };
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      activeTheme: getWindowSystemTheme(),
      themePreference: "system",
      actions: {
        setActiveTheme: (activeTheme: ActiveTheme) => set({ activeTheme }),
        setThemePreference: (themePreference: Theme) => {
          if (themePreference === "system") {
            set({ themePreference, activeTheme: getWindowSystemTheme() });
          } else {
            set({ themePreference, activeTheme: themePreference });
          }
        },
      },
    }),
    {
      name: "theme-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
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

function applyTheme(theme: ActiveTheme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export function useApplyTheme() {
  const activeTheme = useActiveTheme();
  useLayoutEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);
}
