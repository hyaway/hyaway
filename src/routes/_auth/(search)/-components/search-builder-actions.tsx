// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Button } from "@/components/ui-primitives/button";

export function SearchActions({
  onSearch,
  onReset,
  onClear,
  searchDisabled,
  hasCommitted,
  instantSearch = false,
}: {
  onSearch: () => void;
  onReset: () => void;
  onClear: () => void;
  searchDisabled: boolean;
  hasCommitted: boolean;
  instantSearch?: boolean;
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
      {hasCommitted && !instantSearch && (
        <Button variant="ghost" size="default" onClick={onReset} type="button">
          Reset draft
        </Button>
      )}
      <Button variant="ghost" size="default" onClick={onClear} type="button">
        {instantSearch ? "Clear search" : "Clear draft"}
      </Button>
    </div>
  );
}
