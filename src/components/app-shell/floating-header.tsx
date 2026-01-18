// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export interface FloatingHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * A header that hides on scroll down and shows on scroll up.
 * Has an extended hover area below for mouse users to reveal it.
 */
export function FloatingHeader({ children, className }: FloatingHeaderProps) {
  const isVisible = useScrollDirection(50);

  const visibilityClasses = isVisible
    ? "translate-y-0 opacity-100 after:hidden"
    : "pointer-events-none -translate-y-full opacity-0 short:after:h-[calc(var(--header-height-short))] after:h-[calc(var(--header-height))] hover:pointer-events-auto hover:translate-y-0 hover:opacity-100";

  return (
    <header
      className={cn(
        "bg-background/95 supports-backdrop-filter:bg-background/75 short:h-(--header-height-short) sticky top-0 z-40 flex h-(--header-height) shrink-0 flex-col backdrop-blur-sm transition-all duration-200 ease-out",
        // Extended area below header for hover detection - only for pointer devices
        "pointer-hover:after:pointer-events-auto after:absolute after:inset-x-0 after:top-full after:content-['']",
        visibilityClasses,
        className,
      )}
    >
      {children}
    </header>
  );
}
