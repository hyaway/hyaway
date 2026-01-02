import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSelectors } from "./create-selectors";

export type SidebarSide = "left" | "right";

type SidebarStoreState = {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  actions: {
    setSidebarOpen: (side: SidebarSide, open: boolean) => void;
    toggleSidebar: (side: SidebarSide) => void;
  };
};

const useSidebarStoreBase = create<SidebarStoreState>()(
  persist(
    (set) => ({
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      actions: {
        setSidebarOpen: (side, open) =>
          set(
            side === "left"
              ? { leftSidebarOpen: open }
              : { rightSidebarOpen: open },
          ),
        toggleSidebar: (side) =>
          set((state) =>
            side === "left"
              ? { leftSidebarOpen: !state.leftSidebarOpen }
              : { rightSidebarOpen: !state.rightSidebarOpen },
          ),
      },
    }),
    {
      name: "sidebar-state",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
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
 * const leftOpen = useSidebarStore.use.leftSidebarOpen();
 * const { toggleSidebar } = useSidebarStore.use.actions();
 * toggleSidebar('left');
 * ```
 */
export const useSidebarStore = createSelectors(useSidebarStoreBase);
