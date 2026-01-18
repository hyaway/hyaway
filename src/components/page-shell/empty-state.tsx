// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-4 py-12 text-center xl:items-start xl:text-start">
      <p>{message}</p>
      {action}
    </div>
  );
}
