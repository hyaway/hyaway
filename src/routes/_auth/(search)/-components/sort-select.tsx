// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
import {
  IconChevronDown,
  IconSortAscending2Filled,
  IconSortDescending2Filled,
} from "@tabler/icons-react";
import { defaultFilter } from "cmdk";
import { SORT_OPTIONS } from "../-lib/query-builder-fields";
import type { HydrusFileSortType } from "@/integrations/hydrus-api/models";
import { Button } from "@/components/ui-primitives/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui-primitives/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";

export type { SortConfig } from "@/stores/search-defaults";

export function SortSection({
  sortType,
  sortAsc,
  onSortTypeChange,
  onSortAscToggle,
}: {
  sortType: HydrusFileSortType;
  sortAsc: boolean;
  onSortTypeChange: (value: HydrusFileSortType) => void;
  onSortAscToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-muted-foreground shrink-0 text-sm font-medium">
        Sort by
      </span>
      <div className="flex items-center gap-2">
        <SortSelect value={sortType} onChange={onSortTypeChange} />
        <Button
          variant="ghost"
          size="default"
          onClick={onSortAscToggle}
          type="button"
          aria-pressed={sortAsc}
          aria-label={sortAsc ? "Sort ascending" : "Sort descending"}
        >
          {sortAsc ? (
            <>
              <IconSortAscending2Filled className="size-6" />
              <span className="hidden text-sm sm:inline">ascending</span>
            </>
          ) : (
            <>
              <IconSortDescending2Filled className="size-6" />
              <span className="hidden text-sm sm:inline">descending</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function SortSelect({
  value,
  onChange,
}: {
  value: HydrusFileSortType;
  onChange: (value: HydrusFileSortType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel =
    SORT_OPTIONS.find((o) => o.value === value)?.label ?? "import time";

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const isSearching = search.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border px-3 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:opacity-50 sm:w-auto sm:max-w-96 sm:min-w-60"
        aria-label="Sort by"
      >
        <span className="truncate">{selectedLabel}</span>
        <IconChevronDown className="text-muted-foreground size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[70dvh] w-56 p-0"
        align="start"
        side="right"
        positionMethod="fixed"
        sideOffset={-240}
      >
        <Command
          shouldFilter={isSearching}
          filter={(itemValue, searchTerm, keywords) => {
            if (searchTerm.length < 3) {
              const haystack = [itemValue, ...(keywords ?? [])]
                .join(" ")
                .toLowerCase();
              return haystack.includes(searchTerm.toLowerCase()) ? 1 : 0;
            }
            const score = defaultFilter(itemValue, searchTerm, keywords);
            return score > 0.05 ? score : 0;
          }}
        >
          <CommandInput
            placeholder="Search sort…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-none">
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {SORT_OPTIONS.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  data-checked={value === opt.value}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
