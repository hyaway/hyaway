// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";

import { Heading } from "@/components/ui-primitives/heading";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: ReactNode;
  /** Optional icon shown before the title. Prefer `className="size-5 text-muted-foreground"`. */
  icon?: ReactNode;
  /** Optional small text shown next to the title (e.g., read-only hint). */
  suffix?: ReactNode;
  /** Optional element aligned to the right (e.g., filters/actions). */
  right?: ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  icon,
  suffix,
  right,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <div className="inline-flex items-center gap-2">
          {icon}
          <Heading level={2}>{title}</Heading>
        </div>
        {suffix ? (
          <span className="text-muted-foreground text-xs">{suffix}</span>
        ) : null}
      </div>
      {right}
    </div>
  );
}
