// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconLoader } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <IconLoader
      role="status"
      aria-label="Loading"
      className={cn("size-6 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
