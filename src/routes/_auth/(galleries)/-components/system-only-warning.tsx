// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Switch } from "@/components/ui-primitives/switch";

export function SystemOnlyWarning({
  allowSystemOnlySearch,
  onAllowChange,
}: {
  allowSystemOnlySearch: boolean;
  onAllowChange: (value: boolean) => void;
}) {
  return (
    <div className="bg-warning/10 text-warning-foreground border-warning/30 flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <span>
        This query will likely scan the full file set, which can be extremely
        slow and may hang hydrus on large databases. <br />
        Add a non-negated tag to narrow the search.
      </span>
      <label className="flex cursor-pointer items-center gap-2">
        <Switch
          checked={allowSystemOnlySearch}
          onCheckedChange={onAllowChange}
        />
        <span>Allow system-only searches</span>
      </label>
    </div>
  );
}
