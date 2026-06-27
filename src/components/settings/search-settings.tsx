// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SwitchField } from "@/components/settings/setting-fields";
import {
  useDeleteSearchAfterPageSave,
  useSearchSettingsActions,
} from "@/stores/search-settings-store";

export const SEARCH_SETTINGS_TITLE = "Search";

export function SearchHydrusPageSettings() {
  const deleteSearchAfterPageSave = useDeleteSearchAfterPageSave();
  const { setDeleteSearchAfterPageSave } = useSearchSettingsActions();

  return (
    <SwitchField
      id="delete-search-after-page-save-switch"
      label="Delete search after saving as page"
      description="Remove the saved search after hyAway creates the matching Hydrus page."
      checked={deleteSearchAfterPageSave}
      onCheckedChange={setDeleteSearchAfterPageSave}
    />
  );
}
