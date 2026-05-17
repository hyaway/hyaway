// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SavedSearchSortSelect } from "@/components/settings/saved-search-sort-select";
import { SearchBehaviorSettings } from "@/components/settings/search-behavior-settings";
import {
  SettingsCardTitle,
  SettingsResetButton,
} from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import { Separator } from "@/components/ui-primitives/separator";
import {
  useSavedSearchSort,
  useSearchSettingsActions,
} from "@/stores/search-settings-store";

export function SearchAppearanceSettingsCard() {
  const savedSearchSort = useSavedSearchSort();
  const { resetSearchAppearance, setSavedSearchSort } =
    useSearchSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>Search</SettingsCardTitle>
          <SettingsResetButton onReset={resetSearchAppearance} />
        </div>
        <CardDescription>
          Configure search page display and interaction defaults.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SearchBehaviorSettings />
        <Separator className="my-4" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Search list order</span>
            <span className="text-muted-foreground text-xs">
              Used for the search page and tag menus.
            </span>
          </div>
          <SavedSearchSortSelect
            ariaLabel="Search list order"
            value={savedSearchSort}
            onValueChange={setSavedSearchSort}
          />
        </div>
      </CardContent>
    </Card>
  );
}
