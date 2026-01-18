// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { ThumbnailGalleryDisplaySettingsContent } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import { ViewStatisticsLimitSettings } from "@/components/settings/view-statistics-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function MostViewedSettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>Most viewed</SettingsTitle>
      </SettingsHeader>
      <ViewStatisticsLimitSettings idPrefix="popover-" variant="mostViewed" />

      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
