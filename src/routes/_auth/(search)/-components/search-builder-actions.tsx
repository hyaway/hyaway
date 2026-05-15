// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Button } from "@/components/ui-primitives/button";

export function SearchActions({
  onSearch,
  onReset,
  onClear,
  searchDisabled,
  showReset,
}: {
  onSearch: () => void;
  onReset: () => void;
  onClear: () => void;
  searchDisabled: boolean;
  showReset: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={onSearch}
        disabled={searchDisabled}
        type="button"
      >
        Search
      </Button>
      {showReset && (
        <Button variant="ghost" size="sm" onClick={onReset} type="button">
          Reset draft
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onClear} type="button">
        Clear draft
      </Button>
    </div>
  );
}
