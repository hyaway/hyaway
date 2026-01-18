// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SidebarSide = "left" | "right";

/** Duration of sidebar open/close animation in ms (matches CSS --sidebar-open-close-duration) */
export const SIDEBAR_TRANSITION_DURATION = 200;

type SidebarStoreState = {
  // Desktop state (persisted)
  leftDesktopOpen: boolean;
  rightDesktopOpen: boolean;
  // Mobile state (not persisted - sheets should start closed)
  leftMobileOpen: boolean;
  rightMobileOpen: boolean;
  // Transition state (not persisted - tracks if sidebar is animating)
  isTransitioning: boolean;
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

// Track pending transition timeout to avoid stale clears
let transitionTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Start a sidebar transition. Sets isTransitioning to true and schedules
 * it to be cleared after the animation completes.
 */
const startTransition = (
  set: (fn: (state: SidebarStoreState) => Partial<SidebarStoreState>) => void,
) => {
  // Clear any pending timeout to extend the transition period
  if (transitionTimeoutId) {
    clearTimeout(transitionTimeoutId);
  }

  set(() => ({ isTransitioning: true }));

  transitionTimeoutId = setTimeout(() => {
    set(() => ({ isTransitioning: false }));
    transitionTimeoutId = null;
  }, SIDEBAR_TRANSITION_DURATION);
};

// When opening desktop, close both mobile if both desktops will be open
const openDesktop = (side: SidebarSide, state: SidebarStoreState) => {
  const otherDesktopOpen =
    side === "left" ? state.rightDesktopOpen : state.leftDesktopOpen;
  const closeMobile = otherDesktopOpen
    ? { leftMobileOpen: false, rightMobileOpen: false }
    : {};
  return side === "left"
    ? { leftDesktopOpen: true, ...closeMobile }
    : { rightDesktopOpen: true, ...closeMobile };
};

// When opening mobile, close the other side's desktop sidebar
const openMobile = (side: SidebarSide) =>
  side === "left"
    ? {
        leftDesktopOpen: true,
        leftMobileOpen: true,
        rightDesktopOpen: false,
        rightMobileOpen: false,
      }
    : {
        rightDesktopOpen: true,
        rightMobileOpen: true,
        leftDesktopOpen: false,
        leftMobileOpen: false,
      };

const useSidebarStore = create<SidebarStoreState>()(
  persist(
    (set) => ({
      leftDesktopOpen: true,
      rightDesktopOpen: true,
      leftMobileOpen: false,
      rightMobileOpen: false,
      isTransitioning: false,
      actions: {
        // Desktop: open independent, close syncs both
        // Triggers transition tracking for smooth resize handling
        setDesktopOpen: (side, open) => {
          startTransition(set);
          set((state) => (open ? openDesktop(side, state) : closeBoth(side)));
        },
        toggleDesktop: (side) => {
          startTransition(set);
          set((state) => {
            const isOpen =
              side === "left" ? state.leftDesktopOpen : state.rightDesktopOpen;
            return isOpen ? closeBoth(side) : openDesktop(side, state);
          });
        },
        // Mobile: open/close always syncs both (no transition tracking - uses sheet overlay)
        setMobileOpen: (side, open) =>
          set(() => (open ? openMobile(side) : closeBoth(side))),
        toggleMobile: (side) =>
          set((state) => {
            const isOpen =
              side === "left" ? state.leftMobileOpen : state.rightMobileOpen;
            return isOpen ? closeBoth(side) : openMobile(side);
          }),
      },
    }),
    {
      name: "hyaway-sidebar-state",
      storage: createJSONStorage(() => localStorage),
      // Only persist desktop state, not mobile, transitioning, or actions
      partialize: ({
        actions,
        leftMobileOpen,
        rightMobileOpen,
        isTransitioning,
        ...rest
      }) => rest,
    },
  ),
);

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
  const store = useSidebarStore();

  // Conditional hooks - same count per branch, so safe
  const desktopOpen =
    side === "left" ? store.leftDesktopOpen : store.rightDesktopOpen;
  const mobileOpen =
    side === "left" ? store.leftMobileOpen : store.rightMobileOpen;
  const actions = store.actions;

  return {
    desktopOpen,
    mobileOpen,
    setDesktopOpen: (open: boolean) => actions.setDesktopOpen(side, open),
    setMobileOpen: (open: boolean) => actions.setMobileOpen(side, open),
    toggleDesktop: () => actions.toggleDesktop(side),
    toggleMobile: () => actions.toggleMobile(side),
  };
}

export function useSidebarStoreActions() {
  return useSidebarStore((state) => state.actions);
}

/**
 * Hook to check if any sidebar is currently transitioning (animating open/close).
 * Useful for deferring expensive operations like layout recalculations until
 * the sidebar animation completes.
 */
export function useSidebarIsTransitioning() {
  return useSidebarStore((state) => state.isTransitioning);
}
