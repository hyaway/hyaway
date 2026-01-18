// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";

interface AuthStatusScreenProps {
  /** Icon component to display in the circle */
  icon: ReactNode;
  /** Variant determines icon container styling */
  variant: "default" | "warning" | "destructive";
  /** Main heading text */
  title: string;
  /** Description text below the heading */
  description: string;
  /** Optional content between description and actions (e.g., permission list) */
  children?: ReactNode;
  /** Action buttons at the bottom */
  actions: ReactNode;
}

const variantStyles = {
  default: "bg-muted",
  warning: "bg-warning/10",
  destructive: "bg-destructive/10",
} as const;

/**
 * A centered screen layout for auth-related status messages
 * (not configured, missing permissions, connection errors, etc.)
 */
export function AuthStatusScreen({
  icon,
  variant,
  title,
  description,
  children,
  actions,
}: AuthStatusScreenProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div
          className={`flex size-16 items-center justify-center rounded-full ${variantStyles[variant]}`}
        >
          {icon}
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-lg font-medium">{title}</h2>
          <p className="text-muted-foreground text-sm text-balance">
            {description}
          </p>
        </div>
        {children}
        {actions}
      </div>
    </div>
  );
}
