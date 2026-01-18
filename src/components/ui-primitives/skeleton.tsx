// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted animate-pulse rounded-xl opacity-0 delay-500",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
