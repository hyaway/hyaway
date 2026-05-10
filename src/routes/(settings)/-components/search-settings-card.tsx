// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  SEARCH_SETTINGS_TITLE,
  SearchSettings,
} from "@/components/settings/search-settings";
import { SettingsCardTitle } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";

export function SearchSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>{SEARCH_SETTINGS_TITLE}</SettingsCardTitle>
        <CardDescription>
          Configure search behavior for the query builder.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SearchSettings />
      </CardContent>
    </Card>
  );
}
