// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { TagsSortMode } from "@/stores/tags-settings-store";
import {
  useTagsSettingsActions,
  useTagsSortMode,
} from "@/stores/tags-settings-store";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";

const THUMBNAIL_GALLERY_TAGS_SIDEBAR_SORT_OPTIONS = [
  { value: "count", label: "Count" },
  { value: "namespace", label: "Namespace" },
] as const;

export function useThumbnailGalleryTagsSidebarSortMode() {
  return useTagsSortMode();
}

export function ThumbnailGalleryTagsSidebarSortControls() {
  const sortMode = useThumbnailGalleryTagsSidebarSortMode();
  const { setSortMode } = useTagsSettingsActions();

  return (
    <ToggleGroup
      value={[sortMode]}
      onValueChange={(value) => {
        const next = value[0] as TagsSortMode | undefined;
        if (next) setSortMode(next);
      }}
      variant="outline-muted"
      size="sm"
      className="w-full"
    >
      {THUMBNAIL_GALLERY_TAGS_SIDEBAR_SORT_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="flex-1"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
