// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { ThumbnailGalleryDisplaySettingsContent } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function SearchSettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
