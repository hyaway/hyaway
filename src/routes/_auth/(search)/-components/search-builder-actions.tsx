// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Button } from "@/components/ui-primitives/button";

export function SearchActions({
  onSearch,
  onReset,
  onClear,
  searchDisabled,
  hasCommitted,
}: {
  onSearch: () => void;
  onReset: () => void;
  onClear: () => void;
  searchDisabled: boolean;
  hasCommitted: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="default"
        size="default"
        onClick={onSearch}
        disabled={searchDisabled}
        type="button"
      >
        Search
      </Button>
      {hasCommitted && (
        <Button variant="ghost" size="default" onClick={onReset} type="button">
          Reset to current
        </Button>
      )}
      <Button variant="ghost" size="default" onClick={onClear} type="button">
        Clear next
      </Button>
    </div>
  );
}
