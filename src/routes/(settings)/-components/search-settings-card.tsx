// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTrashX } from "@tabler/icons-react";
import { DefaultQuerySettings } from "@/components/settings/default-query-settings";
import {
  SettingsCardTitle,
  SettingsResetButton,
} from "@/components/settings/settings-ui";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import {
  clearSearchQueries,
  clearUnpinnedSearchQueries,
  useOtherSearchKeys,
  useSearchQueryCount,
} from "@/stores/search-queries-store";
import { useSearchSettingsActions } from "@/stores/search-settings-store";

export function SearchSettingsCard() {
  const queryCount = useSearchQueryCount();
  const unpinnedQueryCount = useOtherSearchKeys().length;
  const { resetDefaultQuery } = useSearchSettingsActions();
  const handleClearUnpinnedSearches = clearUnpinnedSearchQueries;
  const handleClearSavedSearches = clearSearchQueries;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>Search</SettingsCardTitle>
          <SettingsResetButton onReset={resetDefaultQuery} />
        </div>
        <CardDescription>
          Configure query defaults and saved search data.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DefaultQuerySettings />
        <div className="border-border flex items-center justify-between gap-4 border-t pt-4">
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
            onClick={handleClearUnpinnedSearches}
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
            onClick={handleClearSavedSearches}
            disabled={queryCount === 0}
          >
            <IconTrashX data-icon="inline-start" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
