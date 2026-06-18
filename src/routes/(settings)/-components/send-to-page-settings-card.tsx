// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  SEND_TO_PAGE_SETTINGS_TITLE,
  SendToPageSettings,
} from "@/components/settings/send-to-page-settings";
import { SettingsCardTitle } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";

export function SendToPageSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>{SEND_TO_PAGE_SETTINGS_TITLE}</SettingsCardTitle>
        <CardDescription>
          Choose a Hydrus page that the file ⋯-menu “Send to Hydrus page” action
          adds files to.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SendToPageSettings />
      </CardContent>
    </Card>
  );
}
