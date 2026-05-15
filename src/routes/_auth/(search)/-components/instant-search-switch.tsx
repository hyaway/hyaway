// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useSearchPageState } from "../-hooks/use-search-page-state";
import { Label } from "@/components/ui-primitives/label";
import { Switch } from "@/components/ui-primitives/switch";
import { cn } from "@/lib/utils";

export function InstantSearchSwitch({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "default";
}) {
  const { searchId, instantSearch, setInstantSearch } = useSearchPageState();
  const id = `instant-search-${searchId}`;

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      onClick={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Label htmlFor={id} className="text-muted-foreground text-sm">
        Instant
      </Label>
      <Switch
        id={id}
        size={size}
        checked={instantSearch}
        onCheckedChange={setInstantSearch}
      />
    </div>
  );
}
