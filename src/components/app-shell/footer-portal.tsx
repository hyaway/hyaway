"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type FooterPortalContextValue = {
  container: HTMLElement | null;
  setContainer: (container: HTMLElement | null) => void;
  hasContent: boolean;
  setHasContent: (hasContent: boolean) => void;
};

const FooterPortalContext =
  React.createContext<FooterPortalContextValue | null>(null);

export function FooterPortalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [hasContent, setHasContent] = React.useState(false);

  const value = React.useMemo(
    () => ({
      container,
      setContainer,
      hasContent,
      setHasContent,
    }),
    [container, hasContent],
  );

  return (
    <FooterPortalContext.Provider value={value}>
      {children}
    </FooterPortalContext.Provider>
  );
}

/** Hook to check if the footer portal has content */
export function useFooterHasContent() {
  const context = React.useContext(FooterPortalContext);
  return context?.hasContent ?? false;
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
      className={cn("flex h-full items-center", className)}
    />
  );
}

export function FooterPortal({ children }: { children: React.ReactNode }) {
  const context = React.useContext(FooterPortalContext);

  if (!context) {
    throw new Error("FooterPortal must be used within a FooterPortalProvider");
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
