"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type RightSidebarContextValue = {
  container: HTMLElement | null;
  setContainer: (container: HTMLElement | null) => void;
  hasContent: boolean;
  setHasContent: (hasContent: boolean) => void;
};

const RightSidebarContext =
  React.createContext<RightSidebarContextValue | null>(null);

export function useRightSidebarHasContent() {
  const context = React.useContext(RightSidebarContext);
  if (!context) {
    throw new Error(
      "useRightSidebarHasContent must be used within a RightSidebarProvider",
    );
  }
  return context.hasContent;
}

export function RightSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [hasContent, setHasContent] = React.useState(false);

  // useMemo needed to avoid new object every render; setContainer/setHasContent are already stable
  const value = React.useMemo(
    () => ({ container, setContainer, hasContent, setHasContent }),
    [container, hasContent],
  );

  return (
    <RightSidebarContext.Provider value={value}>
      {children}
    </RightSidebarContext.Provider>
  );
}

export function RightSidebarSlot({ className }: { className?: string }) {
  const context = React.useContext(RightSidebarContext);

  if (!context) {
    throw new Error(
      "RightSidebarSlot must be used within a RightSidebarProvider",
    );
  }

  return (
    <div
      ref={context.setContainer}
      data-slot="right-sidebar-slot"
      className={className}
    />
  );
}

export function RightSidebarPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = React.useContext(RightSidebarContext);

  if (!context) {
    throw new Error(
      "RightSidebarPortal must be used within a RightSidebarProvider",
    );
  }

  // Track when content is mounted/unmounted
  React.useEffect(() => {
    context.setHasContent(true);
    return () => context.setHasContent(false);
  }, [context]);

  if (!context.container) {
    return null;
  }

  return createPortal(children, context.container);
}
