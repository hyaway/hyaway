// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconBackslash } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CrossedOutIconProps {
  children: ReactNode;
  /** Additional class names for the wrapper */
  className?: string;
  /**
   * Overrides the size/position of the backslash overlay.
   * Useful for smaller icon contexts (e.g., thumbnails).
   */
  backslashClassName?: string;
  /**
   * Background color class for the backslash stroke.
   * Should match the container background for proper layering.
   * @default "text-background"
   */
  strokeBackgroundColor?: string;
}

/**
 * Wraps an icon with a crossed-out backslash overlay.
 * Used for dislike/negative rating states.
 *
 * The backslash is rendered twice:
 * 1. A thick stroke in the background color to create a "cut out" effect
 * 2. A thin stroke in the current text color for the visible line
 *
 * Uses the same proportions as file-ratings-section:
 * -inset-[35%] and size-[170%] to match the -inset-2.5/size-12 on size-7 icons
 */
export function CrossedOutIcon({
  children,
  className,
  backslashClassName,
  strokeBackgroundColor = "text-background",
}: CrossedOutIconProps) {
  const backslashClasses = backslashClassName ?? "-inset-[35%] size-[170%]";

  return (
    <span className={cn("relative", className)}>
      {children}
      <IconBackslash
        aria-hidden
        className={cn(
          "pointer-events-none absolute",
          backslashClasses,
          strokeBackgroundColor,
        )}
        strokeWidth={3}
      />
      <IconBackslash
        aria-hidden
        className={cn("pointer-events-none absolute", backslashClasses)}
        strokeWidth={1.5}
      />
    </span>
  );
}
