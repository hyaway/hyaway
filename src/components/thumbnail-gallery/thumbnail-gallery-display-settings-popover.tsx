// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE,
  ThumbnailGalleryDisplaySettings,
} from "@/components/settings/thumbnail-gallery-display-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function ThumbnailGalleryDisplaySettingsContent() {
  return (
    <>
      <SettingsHeader className="mb-0">
        <SettingsTitle>
          {THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE}
        </SettingsTitle>
      </SettingsHeader>
      <ThumbnailGalleryDisplaySettings idPrefix="popover-" defaultOpen={true} />
    </>
  );
}

export function ThumbnailGalleryDisplaySettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
