// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { FileTagsSortMode } from "@/stores/tags-settings-store";
import {
  useFileTagsSortMode,
  useTagsSettingsActions,
} from "@/stores/tags-settings-store";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";

const FILE_TAGS_SIDEBAR_SORT_OPTIONS = [
  { value: "hydrus", label: "Hydrus" },
  { value: "namespace", label: "Namespace" },
] as const;

export function useFileTagsSidebarSortMode() {
  return useFileTagsSortMode();
}

export function FileTagsSidebarSortControls() {
  const fileSortMode = useFileTagsSidebarSortMode();
  const { setFileSortMode } = useTagsSettingsActions();

  return (
    <ToggleGroup
      value={[fileSortMode]}
      onValueChange={(value) => {
        const next = value[0] as FileTagsSortMode | undefined;
        if (next) setFileSortMode(next);
      }}
      variant="outline-muted"
      size="sm"
      className="w-full"
    >
      {FILE_TAGS_SIDEBAR_SORT_OPTIONS.map((option) => (
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
