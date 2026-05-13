// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from "react";
import { Label } from "@/components/ui-primitives/label";
import { Switch } from "@/components/ui-primitives/switch";
import {
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";
import { cn } from "@/lib/utils";

export function InstantSearchSwitch({
  searchId,
  className,
  size = "sm",
}: {
  searchId: string;
  className?: string;
  size?: "sm" | "default";
}) {
  const entry = useSearchQueryEntry(searchId);
  const { setInstantSearch } = useSearchQueriesActions();
  const id = `instant-search-${searchId}`;

  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      setInstantSearch(searchId, checked);
    },
    [searchId, setInstantSearch],
  );

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
        checked={entry.instantSearch}
        onCheckedChange={handleCheckedChange}
      />
    </div>
  );
}
