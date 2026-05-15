// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useSearchPageState } from "../-hooks/use-search-page-state";
import { ThumbnailGalleryDisplaySettingsContent } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import { SwitchField } from "@/components/settings/setting-fields";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function SearchSettingsPopover() {
  const { instantSearch, setInstantSearch } = useSearchPageState();

  return (
    <SettingsPopover label="Settings">
      <SwitchField
        id="search-instant-search-switch"
        label="Instant search"
        description="Run this search as soon as its query or sort changes."
        checked={instantSearch}
        onCheckedChange={setInstantSearch}
      />
      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
