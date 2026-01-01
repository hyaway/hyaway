"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type FooterPortalContextValue = {
  container: HTMLElement | null;
  setContainer: (container: HTMLElement | null) => void;
};

const FooterPortalContext =
  React.createContext<FooterPortalContextValue | null>(null);

export function FooterPortalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  // useMemo needed to avoid new object every render; setContainer is already stable
  const value = React.useMemo(() => ({ container, setContainer }), [container]);

  return (
    <FooterPortalContext.Provider value={value}>
      {children}
    </FooterPortalContext.Provider>
  );
}

export function FooterPortalSlot({ className }: { className?: string }) {
  const context = React.useContext(FooterPortalContext);

  if (!context) {
    throw new Error(
      "FooterPortalSlot must be used within a FooterPortalProvider",
    );
  }

  return (
    <div
      ref={context.setContainer}
      data-slot="footer-portal-slot"
      className={className}
    />
  );
}

export function FooterPortal({ children }: { children: React.ReactNode }) {
  const context = React.useContext(FooterPortalContext);

  if (!context) {
    throw new Error("FooterPortal must be used within a FooterPortalProvider");
  }

  if (!context.container) {
    return null;
  }

  return createPortal(children, context.container);
}
