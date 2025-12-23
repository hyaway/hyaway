"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type HeaderPortalContextValue = {
  container: HTMLElement | null;
  setContainer: (container: HTMLElement | null) => void;
};

const HeaderPortalContext =
  React.createContext<HeaderPortalContextValue | null>(null);

export function HeaderPortalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  // useMemo needed to avoid new object every render; setContainer is already stable
  const value = React.useMemo(() => ({ container, setContainer }), [container]);

  return (
    <HeaderPortalContext.Provider value={value}>
      {children}
    </HeaderPortalContext.Provider>
  );
}

export function HeaderPortalSlot({ className }: { className?: string }) {
  const context = React.useContext(HeaderPortalContext);

  if (!context) {
    throw new Error(
      "HeaderPortalSlot must be used within a HeaderPortalProvider",
    );
  }

  return (
    <div
      ref={context.setContainer}
      data-slot="header-portal-slot"
      className={className}
    />
  );
}

export function HeaderPortal({ children }: { children: React.ReactNode }) {
  const context = React.useContext(HeaderPortalContext);

  if (!context) {
    throw new Error("HeaderPortal must be used within a HeaderPortalProvider");
  }

  if (!context.container) {
    return null;
  }

  return createPortal(children, context.container);
}
