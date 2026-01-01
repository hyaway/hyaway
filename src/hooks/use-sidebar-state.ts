"use client";

import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarStore } from "@/lib/sidebar-store";

export type SidebarSide = "left" | "right";

export interface SidebarStateOptions {
  /** Which sidebar this is for */
  side: SidebarSide;
  /** Keyboard shortcut key (optional, used with Ctrl/Cmd) */
  keyboardShortcut?: string;
  /** Controlled open state (overrides store) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export interface SidebarState {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean | ((prev: boolean) => boolean)) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

/**
 * Shared hook for sidebar state management.
 * Uses Zustand store for persistence across tabs.
 */
export function useSidebarState({
  side,
  keyboardShortcut,
  open: openProp,
  onOpenChange: setOpenProp,
}: SidebarStateOptions): SidebarState {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // Get store state based on side
  const storeOpen = useSidebarStore((state) =>
    side === "left" ? state.leftSidebarOpen : state.rightSidebarOpen,
  );
  const storeSetOpen = useSidebarStore((state) =>
    side === "left"
      ? state.actions.setLeftSidebarOpen
      : state.actions.setRightSidebarOpen,
  );

  // Use controlled prop if provided, otherwise use store
  const open = openProp ?? storeOpen;

  const setOpen = React.useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      }
      // Always update store for persistence
      storeSetOpen(openState);
    },
    [setOpenProp, open, storeSetOpen],
  );

  // Toggle between mobile sheet and desktop sidebar
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((prev) => !prev) : setOpen((prev) => !prev);
  }, [isMobile, setOpen]);

  // Keyboard shortcut
  React.useEffect(() => {
    if (!keyboardShortcut) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === keyboardShortcut && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, keyboardShortcut]);

  const state = open ? "expanded" : "collapsed";

  return {
    state,
    open,
    setOpen,
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar,
  };
}
