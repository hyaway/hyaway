// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  RECENT_FILES_SETTINGS_TITLE,
  RecentFilesSettings,
} from "@/components/settings/recent-files-settings";
import { SettingsCardTitle } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";

export function RecentFilesSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>{RECENT_FILES_SETTINGS_TITLE}</SettingsCardTitle>
        <CardDescription>
          Configure how recent files are fetched for inbox, archive, and trash
          views.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RecentFilesSettings />
      </CardContent>
    </Card>
  );
}
