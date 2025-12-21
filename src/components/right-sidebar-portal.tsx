"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type RightSidebarContextValue = {
  container: HTMLElement | null;
  setContainer: (container: HTMLElement | null) => void;
};

const RightSidebarContext =
  React.createContext<RightSidebarContextValue | null>(null);

export function RightSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  // useMemo needed to avoid new object every render; setContainer is already stable
  const value = React.useMemo(() => ({ container, setContainer }), [container]);

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

  if (!context.container) {
    return null;
  }

  return createPortal(children, context.container);
}
