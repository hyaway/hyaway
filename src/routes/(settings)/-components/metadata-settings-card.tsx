// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  METADATA_SETTINGS_TITLE,
  MetadataSettings,
} from "@/components/settings/metadata-settings";
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
import { useMetadataSettingsActions } from "@/stores/metadata-settings-store";

export function MetadataSettingsCard() {
  const { reset } = useMetadataSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>{METADATA_SETTINGS_TITLE}</SettingsCardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Configure how gallery file metadata is fetched after search results or
          page media IDs are loaded.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MetadataSettings />
      </CardContent>
    </Card>
  );
}
