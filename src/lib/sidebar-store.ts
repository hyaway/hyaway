import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSelectors } from "./create-selectors";

export type SidebarSide = "left" | "right";

type SidebarStoreState = {
  // Desktop state (persisted)
  leftDesktopOpen: boolean;
  rightDesktopOpen: boolean;
  // Mobile state (not persisted - sheets should start closed)
  leftMobileOpen: boolean;
  rightMobileOpen: boolean;
  actions: {
    setDesktopOpen: (side: SidebarSide, open: boolean) => void;
    toggleDesktop: (side: SidebarSide) => void;
    setMobileOpen: (side: SidebarSide, open: boolean) => void;
    toggleMobile: (side: SidebarSide) => void;
  };
};

// Helpers for state updates
// - Desktop: open independent, close syncs both
// - Mobile: open/close always syncs both
const closeBoth = (side: SidebarSide) =>
  side === "left"
    ? { leftDesktopOpen: false, leftMobileOpen: false }
    : { rightDesktopOpen: false, rightMobileOpen: false };

const openDesktop = (side: SidebarSide) =>
  side === "left" ? { leftDesktopOpen: true } : { rightDesktopOpen: true };

const openBoth = (side: SidebarSide) =>
  side === "left"
    ? { leftDesktopOpen: true, leftMobileOpen: true }
    : { rightDesktopOpen: true, rightMobileOpen: true };

const useSidebarStoreBase = create<SidebarStoreState>()(
  persist(
    (set) => ({
      leftDesktopOpen: true,
      rightDesktopOpen: true,
      leftMobileOpen: false,
      rightMobileOpen: false,
      actions: {
        // Desktop: open independent, close syncs both
        setDesktopOpen: (side, open) =>
          set(() => (open ? openDesktop(side) : closeBoth(side))),
        toggleDesktop: (side) =>
          set((state) => {
            const isOpen =
              side === "left" ? state.leftDesktopOpen : state.rightDesktopOpen;
            return isOpen ? closeBoth(side) : openDesktop(side);
          }),
        // Mobile: open/close always syncs both
        setMobileOpen: (side, open) =>
          set(() => (open ? openBoth(side) : closeBoth(side))),
        toggleMobile: (side) =>
          set((state) => {
            const isOpen =
              side === "left" ? state.leftMobileOpen : state.rightMobileOpen;
            return isOpen ? closeBoth(side) : openBoth(side);
          }),
      },
    }),
    {
      name: "sidebar-state",
      storage: createJSONStorage(() => localStorage),
      // Only persist desktop state, not mobile or actions
      partialize: ({ actions, leftMobileOpen, rightMobileOpen, ...rest }) =>
        rest,
    },
  ),
);

/**
 * Sidebar store with auto-generated selectors.
 *
 * Stores persisted open/closed state for left and right sidebars.
 * Used internally by the Sidebar component.
 *
 * @example
 * ```tsx
 * const leftOpen = useSidebarStore.use.leftDesktopOpen();
 * const { toggleDesktop } = useSidebarStore.use.actions();
 * toggleDesktop('left');
 * ```
 */
export const useSidebarStore = createSelectors(useSidebarStoreBase);

/**
 * Hook to get sidebar state and bound actions for a specific side.
 * Simplifies consuming sidebar state by binding the side parameter.
 *
 * @example
 * ```tsx
 * const { desktopOpen, mobileOpen, setDesktopOpen, toggleDesktop } = useSidebarSide('left');
 * ```
 */
export function useSidebarSide(side: SidebarSide) {
  const use = useSidebarStore.use;

  // Conditional hooks - same count per branch, so safe
  const desktopOpen =
    side === "left" ? use.leftDesktopOpen() : use.rightDesktopOpen();
  const mobileOpen =
    side === "left" ? use.leftMobileOpen() : use.rightMobileOpen();
  const actions = use.actions();

  return {
    desktopOpen,
    mobileOpen,
    setDesktopOpen: (open: boolean) => actions.setDesktopOpen(side, open),
    setMobileOpen: (open: boolean) => actions.setMobileOpen(side, open),
    toggleDesktop: () => actions.toggleDesktop(side),
    toggleMobile: () => actions.toggleMobile(side),
  };
}
