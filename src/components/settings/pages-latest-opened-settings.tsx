// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingsGroup, SwitchField } from "./setting-fields";
import {
  usePagesSettingsActions,
  usePagesShowLatestOpenedPage,
} from "@/stores/pages-settings-store";

export const PAGES_LATEST_OPENED_SETTINGS_TITLE = "Last opened page";

interface PagesLatestOpenedSettingsProps {
  idPrefix?: string;
}

export function PagesLatestOpenedSettings({
  idPrefix = "",
}: PagesLatestOpenedSettingsProps) {
  const showLatestOpenedPage = usePagesShowLatestOpenedPage();
  const { setShowLatestOpenedPage } = usePagesSettingsActions();

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}show-latest-opened-page-switch`}
        label="Last opened page"
        description="Show a shortcut to your last opened page"
        checked={showLatestOpenedPage}
        onCheckedChange={setShowLatestOpenedPage}
      />
    </SettingsGroup>
  );
}
