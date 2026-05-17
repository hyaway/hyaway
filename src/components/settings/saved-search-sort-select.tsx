// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconSortDescending } from "@tabler/icons-react";
import type { SavedSearchSort } from "@/stores/search-settings-store";
import {
  SAVED_SEARCH_SORT_VALUES,
  isSavedSearchSort,
} from "@/stores/search-settings-store";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui-primitives/select";

const SAVED_SEARCH_SORT_LABELS = {
  "newest-first": "Newest first",
  "oldest-first": "Oldest first",
  "modified-desc": "Last modified first",
} satisfies Record<SavedSearchSort, string>;

const SAVED_SEARCH_SORT_OPTIONS = SAVED_SEARCH_SORT_VALUES.map((value) => ({
  value,
  label: SAVED_SEARCH_SORT_LABELS[value],
}));

export function SavedSearchSortSelect({
  value,
  onValueChange,
  ariaLabel,
}: {
  value: SavedSearchSort;
  onValueChange: (sort: SavedSearchSort) => void;
  ariaLabel: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextSort) => {
        if (nextSort && isSavedSearchSort(nextSort)) {
          onValueChange(nextSort);
        }
      }}
    >
      <SelectTrigger aria-label={ariaLabel} className="rounded-lg">
        <IconSortDescending className="size-4" />
        <span className="truncate">{SAVED_SEARCH_SORT_LABELS[value]}</span>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-52">
        <SelectGroup>
          {SAVED_SEARCH_SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
