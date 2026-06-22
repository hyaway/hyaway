// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReviewTagsSortMode } from "@/stores/tags-settings-store";
import {
  useReviewTagsSortMode,
  useTagsSettingsActions,
} from "@/stores/tags-settings-store";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";

const REVIEW_CURRENT_FILE_TAGS_SIDEBAR_SORT_OPTIONS = [
  { value: "hydrus", label: "Hydrus" },
  { value: "namespace", label: "Namespace" },
] as const;

export function useReviewCurrentFileTagsSidebarSortMode() {
  return useReviewTagsSortMode();
}

export function ReviewCurrentFileTagsSidebarSortControls() {
  const reviewSortMode = useReviewCurrentFileTagsSidebarSortMode();
  const { setReviewSortMode } = useTagsSettingsActions();

  return (
    <ToggleGroup
      value={[reviewSortMode]}
      onValueChange={(value) => {
        const next = value[0] as ReviewTagsSortMode | undefined;
        if (next) setReviewSortMode(next);
      }}
      variant="outline-muted"
      size="sm"
      className="w-full"
    >
      {REVIEW_CURRENT_FILE_TAGS_SIDEBAR_SORT_OPTIONS.map((option) => (
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
