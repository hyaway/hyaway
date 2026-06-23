// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { FileTagsSortMode } from "@/stores/tags-settings-store";
import {
  useFileTagsSortMode,
  useTagsSettingsActions,
} from "@/stores/tags-settings-store";
import { Label } from "@/components/ui-primitives/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import { cn } from "@/lib/utils";

export const FILE_TAGS_SETTINGS_TITLE = "File tags";
export const DEFAULT_FILE_TAGS_SORT_MODE: FileTagsSortMode = "namespace";

const FILE_TAGS_SORT_OPTIONS = [
  { value: "api", label: "Basic" },
  { value: "namespace", label: "Namespace" },
] as const;

export function useFileTagsDisplaySortMode() {
  return useFileTagsSortMode();
}

interface FileTagsSortToggleProps {
  id?: string;
  variant?: React.ComponentProps<typeof ToggleGroup>["variant"];
  size?: React.ComponentProps<typeof ToggleGroup>["size"];
  className?: string;
  itemClassName?: string;
}

export function FileTagsSortToggle({
  id,
  variant = "outline",
  size = "sm",
  className,
  itemClassName,
}: FileTagsSortToggleProps) {
  const fileSortMode = useFileTagsDisplaySortMode();
  const { setFileSortMode } = useTagsSettingsActions();

  return (
    <ToggleGroup
      id={id}
      value={[fileSortMode]}
      onValueChange={(value) => {
        const next = value[0] as FileTagsSortMode | undefined;
        if (next) setFileSortMode(next);
      }}
      variant={variant}
      size={size}
      className={className}
    >
      {FILE_TAGS_SORT_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={itemClassName}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export interface FileTagsSettingsProps {
  idPrefix?: string;
  className?: string;
}

export function FileTagsSettings({
  idPrefix = "",
  className,
}: FileTagsSettingsProps) {
  const toggleId = `${idPrefix}file-tags-sort-toggle`;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Label htmlFor={toggleId}>Sort tags by</Label>
      <FileTagsSortToggle id={toggleId} variant="outline" />
    </div>
  );
}
