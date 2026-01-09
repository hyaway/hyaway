"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type HeaderActionsPortalContextValue = {
  container: HTMLElement | null;
  setContainer: (container: HTMLElement | null) => void;
  hasContent: boolean;
  setHasContent: (hasContent: boolean) => void;
};

const HeaderActionsPortalContext =
  React.createContext<HeaderActionsPortalContextValue | null>(null);

export function HeaderActionsPortalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [hasContent, setHasContent] = React.useState(false);

  const value = React.useMemo(
    () => ({ container, setContainer, hasContent, setHasContent }),
    [container, hasContent],
  );

  return (
    <HeaderActionsPortalContext.Provider value={value}>
      {children}
    </HeaderActionsPortalContext.Provider>
  );
}

/** Hook to check if the header actions portal has content */
export function useHeaderActionsHasContent() {
  const context = React.useContext(HeaderActionsPortalContext);
  return context?.hasContent ?? false;
}

export function HeaderActionsPortalSlot({ className }: { className?: string }) {
  const context = React.useContext(HeaderActionsPortalContext);

  if (!context) {
    throw new Error(
      "HeaderActionsPortalSlot must be used within a HeaderActionsPortalProvider",
    );
  }

  return (
    <div
      ref={context.setContainer}
      data-slot="header-actions-portal-slot"
      className={cn("flex h-full items-center", className)}
    />
  );
}

export function HeaderActionsPortal({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = React.useContext(HeaderActionsPortalContext);

  if (!context) {
    throw new Error(
      "HeaderActionsPortal must be used within a HeaderActionsPortalProvider",
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
