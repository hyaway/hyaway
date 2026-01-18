// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { ThumbnailGalleryDisplaySettingsContent } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import {
  RANDOM_INBOX_SETTINGS_TITLE,
  RandomInboxSettings,
} from "@/components/settings/random-inbox-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function RandomInboxSettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>{RANDOM_INBOX_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <RandomInboxSettings idPrefix="popover-" min={10} step={10} />

      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
