// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SwitchField } from "./setting-fields";
import {
  useFileViewerSettingsActions,
  useNotesOpenExpanded,
} from "@/stores/file-viewer-settings-store";

export const FILE_DETAIL_SETTINGS_TITLE = "File details";

export interface FileDetailSettingsProps {
  idPrefix?: string;
}

export function FileDetailSettings({ idPrefix = "" }: FileDetailSettingsProps) {
  const notesOpenExpanded = useNotesOpenExpanded();
  const { setNotesOpenExpanded } = useFileViewerSettingsActions();

  return (
    <SwitchField
      id={`${idPrefix}notes-open-expanded-switch`}
      label="Open notes expanded"
      checked={notesOpenExpanded}
      onCheckedChange={setNotesOpenExpanded}
    />
  );
}
