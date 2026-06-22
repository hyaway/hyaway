// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-col items-center gap-4 py-12 text-center xl:items-start xl:text-start",
        className,
      )}
    >
      <p>{message}</p>
      {action}
    </div>
  );
}
