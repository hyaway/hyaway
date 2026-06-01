// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  FILE_DETAIL_SETTINGS_TITLE,
  FileDetailSettings,
} from "@/components/settings/file-detail-settings";
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
import { useFileViewerSettingsActions } from "@/stores/file-viewer-settings-store";

export function FileDetailSettingsCard() {
  const { setNotesOpenExpanded } = useFileViewerSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>{FILE_DETAIL_SETTINGS_TITLE}</SettingsCardTitle>
          <SettingsResetButton onReset={() => setNotesOpenExpanded(false)} />
        </div>
        <CardDescription>
          Configure how file metadata and details are displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileDetailSettings />
      </CardContent>
    </Card>
  );
}
