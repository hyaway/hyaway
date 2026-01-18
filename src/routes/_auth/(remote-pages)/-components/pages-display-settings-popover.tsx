// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  PAGES_DISPLAY_SETTINGS_TITLE,
  PagesDisplaySettings,
} from "@/components/settings/pages-display-settings";
import {
  PAGES_URLS_SETTINGS_TITLE,
  PagesUrlsSettings,
} from "@/components/settings/pages-urls-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";
import { Separator } from "@/components/ui-primitives/separator";

export function PagesDisplaySettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>{PAGES_URLS_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <PagesUrlsSettings idPrefix="popover-" />
      <Separator className="my-4" />
      <SettingsHeader>
        <SettingsTitle>{PAGES_DISPLAY_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <PagesDisplaySettings idPrefix="popover-" defaultOpen />
    </SettingsPopover>
  );
}
