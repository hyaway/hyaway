// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  SCRATCHPAD_SETTINGS_TITLE,
  ScratchpadSettings,
} from "@/components/settings/scratchpad-settings";
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
import { useScratchpadSettingsActions } from "@/stores/scratchpad-settings-store";

export function ScratchpadSettingsCard() {
  const { reset } = useScratchpadSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>{SCRATCHPAD_SETTINGS_TITLE}</SettingsCardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Configure the remote page where you can send files that hyAway or
          Client API cannot handle yet, so you can process them later in Hydrus.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScratchpadSettings />
      </CardContent>
    </Card>
  );
}
