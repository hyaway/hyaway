// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTrashX } from "@tabler/icons-react";
import { DefaultQuerySettings } from "@/components/settings/default-query-settings";
import { SearchBehaviorSettings } from "@/components/settings/search-behavior-settings";
import { SettingsPopover } from "@/components/settings/settings-popover";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { Button } from "@/components/ui-primitives/button";
import {
  clearSearchQueries,
  clearUnpinnedSearchQueries,
  useOtherSearchKeys,
  useSearchQueryCount,
} from "@/stores/search-queries-store";

export function SearchIndexSettingsPopover() {
  const queryCount = useSearchQueryCount();
  const unpinnedQueryCount = useOtherSearchKeys().length;

  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>Search</SettingsTitle>
      </SettingsHeader>
      <SearchBehaviorSettings />
      <DefaultQuerySettings />
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Remove unpinned searches</span>
          <span className="text-muted-foreground text-xs">
            {unpinnedQueryCount} unpinned{" "}
            {unpinnedQueryCount === 1 ? "search" : "searches"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearUnpinnedSearchQueries}
          disabled={unpinnedQueryCount === 0}
        >
          <IconTrashX data-icon="inline-start" />
          Remove
        </Button>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Remove all saved searches</span>
          <span className="text-muted-foreground text-xs">
            {queryCount} {queryCount === 1 ? "search" : "searches"} saved
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearSearchQueries}
          disabled={queryCount === 0}
        >
          <IconTrashX data-icon="inline-start" />
          Remove
        </Button>
      </div>
    </SettingsPopover>
  );
}
