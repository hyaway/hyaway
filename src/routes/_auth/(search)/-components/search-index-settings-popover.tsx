// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTrashX } from "@tabler/icons-react";
import { DefaultQuerySettings } from "@/components/settings/default-query-settings";
import { SettingsPopover } from "@/components/settings/settings-popover";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { Button } from "@/components/ui-primitives/button";
import {
  useOtherSearchKeys,
  useSearchQueriesActions,
  useSearchQueryCount,
} from "@/stores/search-queries-store";

export function SearchIndexSettingsPopover() {
  const queryCount = useSearchQueryCount();
  const unpinnedQueryCount = useOtherSearchKeys().length;
  const { clearSavedSearches, clearUnpinnedSearches } =
    useSearchQueriesActions();

  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>Search</SettingsTitle>
      </SettingsHeader>
      <DefaultQuerySettings />
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Clear unpinned searches</span>
          <span className="text-muted-foreground text-xs">
            {unpinnedQueryCount} unpinned{" "}
            {unpinnedQueryCount === 1 ? "search" : "searches"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearUnpinnedSearches}
          disabled={unpinnedQueryCount === 0}
        >
          <IconTrashX data-icon="inline-start" />
          Clear
        </Button>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Clear saved searches</span>
          <span className="text-muted-foreground text-xs">
            {queryCount} {queryCount === 1 ? "search" : "searches"} saved
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearSavedSearches}
          disabled={queryCount === 0}
        >
          <IconTrashX data-icon="inline-start" />
          Clear
        </Button>
      </div>
    </SettingsPopover>
  );
}
