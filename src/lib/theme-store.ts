import { useEffect, useLayoutEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSelectors } from "./create-selectors";
import { setupCrossTabSync } from "./cross-tab-sync";

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

const useThemeStoreBase = create<ThemeState>()(
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
      name: "theme-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, _hasHydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.actions.setHasHydrated(true);
      },
    },
  ),
);

/**
 * Theme store with auto-generated selectors.
 *
 * @example
 * ```tsx
 * const activeTheme = useThemeStore.use.activeTheme();
 * const actions = useThemeStore.use.actions();
 * ```
 */
export const useThemeStore = createSelectors(useThemeStoreBase);

/**
 * Shorthand for `useThemeStore.use`.
 * @example
 * ```tsx
 * const activeTheme = useTheme.activeTheme();
 * const { setThemePreference } = useTheme.actions();
 * ```
 */
export const useTheme = useThemeStore.use;

export function getWindowSystemTheme(): ActiveTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
function applyTheme(theme: ActiveTheme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export function useSystemThemeListener() {
  const { resetSystemTheme } = useTheme.actions();
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", resetSystemTheme);
    return () => {
      mediaQuery.removeEventListener("change", resetSystemTheme);
    };
  }, [resetSystemTheme]);
}

export function useApplyTheme() {
  const activeTheme = useTheme.activeTheme();
  useLayoutEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);
}

// Sync theme across tabs
setupCrossTabSync(useThemeStore);
