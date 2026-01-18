// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  RANDOM_INBOX_SETTINGS_TITLE,
  RandomInboxSettings,
} from "@/components/settings/random-inbox-settings";
import { SettingsCardTitle } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";

export function RandomInboxSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>{RANDOM_INBOX_SETTINGS_TITLE}</SettingsCardTitle>
        <CardDescription>
          Configure how many files are fetched for the random inbox view.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RandomInboxSettings />
      </CardContent>
    </Card>
  );
}
