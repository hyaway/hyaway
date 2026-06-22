// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconAlertCircle } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui-primitives/button";
import { cn } from "@/lib/utils";

interface SwipeActionWarningProps {
  variant?: "default" | "destructive";
  title: string;
  description: ReactNode;
  onClear: () => void;
}

export function SwipeActionWarning({
  variant = "default",
  title,
  description,
  onClear,
}: SwipeActionWarningProps) {
  return (
    <div
      role="alert"
      className={cn(
        "bg-card text-card-foreground @container flex min-w-0 items-start gap-3 rounded-lg border px-5 py-4 text-left text-sm",
        variant === "destructive" && "text-destructive",
      )}
    >
      <IconAlertCircle className="mt-0.5 hidden size-6 shrink-0 @[14rem]:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="font-medium wrap-break-word">{title}</div>
        <div
          className={cn(
            "text-muted-foreground text-sm wrap-break-word",
            variant === "destructive" && "text-destructive/90",
          )}
        >
          {description}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 self-start"
          onClick={onClear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
