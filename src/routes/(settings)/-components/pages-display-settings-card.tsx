// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  PAGES_DISPLAY_SETTINGS_TITLE,
  PagesDisplaySettings,
} from "@/components/settings/pages-display-settings";
import { PagesUrlsSettings } from "@/components/settings/pages-urls-settings";
import {
  SettingsCardTitle,
  SettingsResetButton,
  SettingsSubheading,
} from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import { Separator } from "@/components/ui-primitives/separator";
import { usePagesSettingsActions } from "@/stores/pages-settings-store";

export function PagesDisplaySettingsCard() {
  const { reset } = usePagesSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>Pages</SettingsCardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Configure pages grid display and URL format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PagesUrlsSettings />
        <Separator className="my-4" />
        <SettingsSubheading className="mb-4">
          {PAGES_DISPLAY_SETTINGS_TITLE}
        </SettingsSubheading>
        <PagesDisplaySettings />
      </CardContent>
    </Card>
  );
}
