// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { ThumbnailGalleryDisplaySettingsContent } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import { SwitchField } from "@/components/settings/setting-fields";
import { SettingsPopover } from "@/components/settings/settings-popover";
import {
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";

export function SearchSettingsPopover({ searchId }: { searchId: string }) {
  const entry = useSearchQueryEntry(searchId);
  const { setInstantSearch } = useSearchQueriesActions();

  return (
    <SettingsPopover label="Settings">
      <SwitchField
        id="search-instant-search-switch"
        label="Instant search"
        description="Run this search as soon as its query or sort changes."
        checked={entry.instantSearch}
        onCheckedChange={(checked) => setInstantSearch(searchId, checked)}
      />
      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
