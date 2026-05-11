// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTrashX } from "@tabler/icons-react";
import { SettingsCardTitle } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import {
  clearSearchQueries,
  useSearchQueryCount,
} from "@/stores/search-queries-store";

export function SearchSettingsCard() {
  const queryCount = useSearchQueryCount();

  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>Search</SettingsCardTitle>
        <CardDescription>
          Configure search behavior for the query builder.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
            onClick={clearSearchQueries}
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
