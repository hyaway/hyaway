// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { ThumbnailGalleryDisplaySettingsContent } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import {
  SEARCH_SETTINGS_TITLE,
  SearchSettings,
} from "@/components/settings/search-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function SearchSettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>{SEARCH_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <SearchSettings idPrefix="popover-" />
      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
