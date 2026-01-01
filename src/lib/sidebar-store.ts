import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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

export const useSidebarStore = create<SidebarStoreState>()(
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

// Selectors
export const useLeftSidebarOpen = () =>
  useSidebarStore((state) => state.leftSidebarOpen);

export const useRightSidebarOpen = () =>
  useSidebarStore((state) => state.rightSidebarOpen);

export const useSidebarActions = () =>
  useSidebarStore((state) => state.actions);
