// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  RATINGS_SETTINGS_TITLE,
  RatingsSettings,
} from "@/components/settings/ratings-settings";
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
import { useRatingsSettingsActions } from "@/stores/ratings-settings-store";

export function RatingsSettingsCard() {
  const { reset } = useRatingsSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>{RATINGS_SETTINGS_TITLE}</SettingsCardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Configure which ratings appear in overlays and review mode.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RatingsSettings />
      </CardContent>
    </Card>
  );
}
