import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSelectors } from "./create-selectors";
import { setupCrossTabSync } from "./cross-tab-sync";

type SidebarStoreState = {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  actions: {
    setLeftSidebarOpen: (open: boolean) => void;
    setRightSidebarOpen: (open: boolean) => void;
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
  };
};

const useSidebarStoreBase = create<SidebarStoreState>()(
  persist(
    (set) => ({
      leftSidebarOpen: true,
      rightSidebarOpen: false,
      actions: {
        setLeftSidebarOpen: (leftSidebarOpen: boolean) =>
          set({ leftSidebarOpen }),
        setRightSidebarOpen: (rightSidebarOpen: boolean) =>
          set({ rightSidebarOpen }),
        toggleLeftSidebar: () =>
          set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
        toggleRightSidebar: () =>
          set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
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
 * @example
 * ```tsx
 * const leftOpen = useSidebarStore.use.leftSidebarOpen();
 * const actions = useSidebarStore.use.actions();
 * ```
 */
export const useSidebarStore = createSelectors(useSidebarStoreBase);

/**
 * Shorthand for `useSidebarStore.use`.
 * @example
 * ```tsx
 * const leftOpen = useSidebar.leftSidebarOpen();
 * const { toggleLeftSidebar } = useSidebar.actions();
 * ```
 */
export const useSidebar = useSidebarStore.use;

// Sync sidebar state across tabs
setupCrossTabSync(useSidebarStore);
