// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  DEFAULT_FILE_TAGS_SORT_MODE,
  FILE_TAGS_SETTINGS_TITLE,
  FileTagsSettings,
} from "./file-tags-settings";
import { SwitchField } from "./setting-fields";
import { SettingsSubheading } from "./settings-ui";
import {
  useFileViewerSettingsActions,
  useNotesOpenExpanded,
} from "@/stores/file-viewer-settings-store";
import { useTagsSettingsActions } from "@/stores/tags-settings-store";

export const FILE_DETAIL_SETTINGS_TITLE = "File details";

export interface FileDetailSettingsProps {
  idPrefix?: string;
}

export function FileDetailSettings({ idPrefix = "" }: FileDetailSettingsProps) {
  const notesOpenExpanded = useNotesOpenExpanded();
  const { setNotesOpenExpanded } = useFileViewerSettingsActions();

  return (
    <div className="flex flex-col gap-5">
      <SwitchField
        id={`${idPrefix}notes-open-expanded-switch`}
        label="Open notes expanded"
        checked={notesOpenExpanded}
        onCheckedChange={setNotesOpenExpanded}
      />
      <div className="flex flex-col gap-3">
        <SettingsSubheading>{FILE_TAGS_SETTINGS_TITLE}</SettingsSubheading>
        <FileTagsSettings idPrefix={idPrefix} />
      </div>
    </div>
  );
}

export function useResetFileDetailSettings() {
  const { setNotesOpenExpanded } = useFileViewerSettingsActions();
  const { setFileSortMode } = useTagsSettingsActions();

  return () => {
    setNotesOpenExpanded(false);
    setFileSortMode(DEFAULT_FILE_TAGS_SORT_MODE);
  };
}
