// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronRight,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import { defaultFilter } from "cmdk";
import {
  getSortColorHex,
  getSortOption,
  getSortOrderLabel,
} from "../-lib/query-builder-fields";
import type { CSSProperties } from "react";
import { HydrusFileSortType } from "@/integrations/hydrus-api/models";
import { badgeVariants } from "@/components/ui-primitives/badge";
import { Button } from "@/components/ui-primitives/button";
import { useNamespaceColor } from "@/integrations/hydrus-api/queries/options";
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
import { getThemeAdjustedColorFromHex } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/stores/theme-store";

const SORT_GROUPS = [
  {
    label: "time",
    options: [
      HydrusFileSortType.ImportTime,
      HydrusFileSortType.ModifiedTime,
      HydrusFileSortType.LastViewedTime,
      HydrusFileSortType.ArchiveTimestamp,
    ],
  },
  {
    label: "file",
    options: [
      HydrusFileSortType.FileSize,
      HydrusFileSortType.FileType,
      HydrusFileSortType.ApproximateBitrate,
      HydrusFileSortType.HasAudio,
      HydrusFileSortType.HashHex,
      HydrusFileSortType.PixelHashHex,
      HydrusFileSortType.Blurhash,
    ],
  },
  {
    label: "dimensions",
    options: [
      HydrusFileSortType.Width,
      HydrusFileSortType.Height,
      HydrusFileSortType.Ratio,
      HydrusFileSortType.NumberOfPixels,
    ],
  },
  {
    label: "duration",
    options: [
      HydrusFileSortType.Duration,
      HydrusFileSortType.Framerate,
      HydrusFileSortType.NumberOfFrames,
    ],
  },
  {
    label: "average colour",
    options: [
      HydrusFileSortType.AverageColourLightness,
      HydrusFileSortType.AverageColourChromaticMagnitude,
      HydrusFileSortType.AverageColourGreenRedAxis,
      HydrusFileSortType.AverageColourBlueYellowAxis,
      HydrusFileSortType.AverageColourHue,
    ],
  },
  {
    label: "tags",
    options: [HydrusFileSortType.NumberOfTags],
  },
  {
    label: "views",
    options: [
      HydrusFileSortType.NumberOfMediaViews,
      HydrusFileSortType.TotalMediaViewtime,
    ],
  },
  {
    label: "collections",
    options: [HydrusFileSortType.NumberOfCollectionFiles],
  },
  {
    label: "random",
    options: [HydrusFileSortType.Random],
  },
] as const;

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
  const sortOrderLabel = getSortOrderLabel(sortType, sortAsc);
  const theme = useActiveTheme();
  const sortColor = getThemeAdjustedColorFromHex(
    getSortColorHex(sortType, sortAsc),
    theme,
  );
  const sortColorStyle = sortColor
    ? ({ "--badge-overlay": sortColor } as CSSProperties)
    : undefined;

  return (
    <div className="@container flex max-w-2xl flex-wrap items-center gap-2">
      <span className="text-muted-foreground shrink-0 text-sm font-medium">
        Sort by
      </span>
      <div
        className={cn(
          "flex min-w-full flex-1 flex-wrap items-center gap-2 @sm:min-w-0",
          "w-full max-w-5xl",
        )}
      >
        <SortSelect
          value={sortType}
          sortAsc={sortAsc}
          onChange={onSortTypeChange}
        />
        {sortOrderLabel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSortAscToggle}
            type="button"
            aria-pressed={sortAsc}
            aria-label={`Sort ${sortOrderLabel}`}
            className={cn(
              sortColor &&
                "text-(--badge-overlay) hover:bg-[color-mix(in_srgb,var(--badge-overlay)_20%,transparent)] hover:text-(--badge-overlay)",
            )}
            style={sortColorStyle}
          >
            {sortAsc ? (
              <IconSortAscending className="size-5" />
            ) : (
              <IconSortDescending className="size-5" />
            )}
            <span className="text-sm @2xs:hidden @lg:inline">
              {sortOrderLabel}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

export function SortSelect({
  value,
  sortAsc,
  onChange,
}: {
  value: HydrusFileSortType;
  sortAsc: boolean;
  onChange: (value: HydrusFileSortType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState<string | null>(null);
  const theme = useActiveTheme();
  const defaultColor = useNamespaceColor("");
  const selectedSortColor = getThemeAdjustedColorFromHex(
    getSortColorHex(value, sortAsc),
    theme,
  );
  const color = selectedSortColor ?? defaultColor;
  const combinedStyle: CSSProperties = { "--badge-overlay": color };

  const selectedLabel = getSortOption(value).label;

  useEffect(() => {
    if (!open) {
      setSearch("");
      setActivePage(null);
    }
  }, [open]);

  const isSearching = search.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          badgeVariants({ variant: "overlay", size: "default" }),
          "h-9 max-w-2xl min-w-40 flex-1 basis-40 cursor-pointer justify-between gap-1.5 px-3 text-sm outline-none disabled:opacity-50",
        )}
        style={combinedStyle}
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
            {isSearching ? (
              SORT_GROUPS.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.options.map((sortType) => {
                    const opt = getSortOption(sortType);

                    return (
                      <CommandItem
                        key={opt.value}
                        value={opt.label}
                        keywords={[group.label, opt.label]}
                        data-checked={value === opt.value || undefined}
                        onSelect={() => {
                          onChange(opt.value);
                          setOpen(false);
                        }}
                      >
                        <SortOptionLabel sortType={opt.value} />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))
            ) : activePage === null ? (
              <CommandGroup>
                {SORT_GROUPS.flatMap((group) =>
                  group.options.length === 1 ? (
                    group.options.map((sortType) => {
                      const opt = getSortOption(sortType);

                      return (
                        <CommandItem
                          key={opt.value}
                          value={opt.label}
                          keywords={[group.label, opt.label]}
                          data-checked={value === opt.value || undefined}
                          onSelect={() => {
                            onChange(opt.value);
                            setOpen(false);
                          }}
                        >
                          <SortOptionLabel sortType={opt.value} />
                        </CommandItem>
                      );
                    })
                  ) : (
                    <CommandItem
                      key={group.label}
                      value={group.label}
                      data-checked={
                        group.options.some((option) => option === value) ||
                        undefined
                      }
                      onSelect={() => setActivePage(group.label)}
                    >
                      <span className="flex-1">{group.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {group.options.length}
                      </span>
                      <IconChevronRight className="text-muted-foreground size-3.5" />
                    </CommandItem>
                  ),
                )}
              </CommandGroup>
            ) : (
              <>
                <CommandGroup>
                  <CommandItem
                    value="__back"
                    onSelect={() => setActivePage(null)}
                  >
                    <IconArrowLeft className="text-muted-foreground size-3.5" />
                    <span className="text-muted-foreground">{activePage}</span>
                  </CommandItem>
                </CommandGroup>
                <CommandGroup>
                  {SORT_GROUPS.find(
                    (group) => group.label === activePage,
                  )?.options.map((sortType) => {
                    const opt = getSortOption(sortType);

                    return (
                      <CommandItem
                        key={opt.value}
                        value={opt.label}
                        keywords={[activePage, opt.label]}
                        data-checked={value === opt.value || undefined}
                        onSelect={() => {
                          onChange(opt.value);
                          setOpen(false);
                        }}
                      >
                        <SortOptionLabel sortType={opt.value} />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SortOptionLabel({ sortType }: { sortType: HydrusFileSortType }) {
  const theme = useActiveTheme();
  const option = getSortOption(sortType);
  const color = getThemeAdjustedColorFromHex(getSortColorHex(sortType), theme);

  if (!color) return option.label;

  return (
    <span
      className="inline-flex items-center gap-2 text-(--badge-overlay)"
      style={{ "--badge-overlay": color } as CSSProperties}
    >
      <span className="size-2.5 rounded-full bg-(--badge-overlay)" />
      {option.label}
    </span>
  );
}
