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
  getDefaultSortAsc,
  getSortColorHex,
  getSortOption,
  getSortOrderLabel,
} from "../-lib/query-builder-fields";
import { NamespaceSortBadge } from "./search-sort-tag";
import type { CSSProperties } from "react";
import type { SortConfig } from "@/stores/search-defaults";
import { HydrusFileSortType } from "@/integrations/hydrus-api/models";
import { Button } from "@/components/ui-primitives/button";
import { Input } from "@/components/ui-primitives/input";
import {
  useDefaultNamespaceSorts,
  useNamespaceColor,
} from "@/integrations/hydrus-api/queries/options";
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
import {
  formatNamespaceSortValue,
  isNamespaceSortConfig,
  parseNamespaceSortValue,
} from "@/stores/search-defaults";

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

const SORT_DROPDOWN_HEIGHT_STYLE = {
  "--sort-dropdown-max-height": "min(60dvh, var(--available-height))",
  "--sort-dropdown-list-max-height":
    "calc(var(--sort-dropdown-max-height) - 3rem)",
} as CSSProperties;

const NAMESPACE_SORT_COMMAND_BADGE_CLASSNAME = cn(
  "group-data-selected/command-item:before:bg-[color-mix(in_srgb,var(--badge-overlay)_25%,transparent)]",
);

export type { SortConfig } from "@/stores/search-defaults";

export function SortSection({
  sort,
  onSortChange,
  onSortAscToggle,
}: {
  sort: SortConfig;
  onSortChange: (value: SortConfig) => void;
  onSortAscToggle: () => void;
}) {
  const sortAsc = sort.sortAsc;
  const sortOrderLabel = isNamespaceSortConfig(sort)
    ? sortAsc
      ? "a-z"
      : "z-a"
    : getSortOrderLabel(sort.sortType, sortAsc);
  const theme = useActiveTheme();
  const sortColor = getThemeAdjustedColorFromHex(
    isNamespaceSortConfig(sort)
      ? undefined
      : getSortColorHex(sort.sortType, sortAsc),
    theme,
  );
  const sortColorStyle = sortColor
    ? ({ "--badge-overlay": sortColor } as CSSProperties)
    : undefined;
  const isNamespaceSort = isNamespaceSortConfig(sort);

  return (
    <div className="@container flex max-w-5xl flex-wrap items-center gap-2">
      <span className="text-muted-foreground shrink-0 text-sm font-medium">
        Sort by
      </span>
      <div
        className={cn(
          "flex min-w-full flex-1 flex-wrap items-center gap-2 @sm:min-w-0",
          "w-full max-w-5xl",
        )}
      >
        <SortSelect value={sort} onChange={onSortChange} />
        {isNamespaceSort && (
          <NamespaceSortSelect value={sort} onChange={onSortChange} />
        )}
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
  onChange,
}: {
  value: SortConfig;
  onChange: (value: SortConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState<string | null>(null);
  const theme = useActiveTheme();
  const namespaceColor = useNamespaceColor("");
  const isNamespaceSort = isNamespaceSortConfig(value);
  const selectedSystemSortType = isNamespaceSort ? null : value.sortType;
  const selectedSortColor = getThemeAdjustedColorFromHex(
    isNamespaceSort
      ? undefined
      : getSortColorHex(value.sortType, value.sortAsc),
    theme,
  );
  const selectedColor = selectedSortColor ?? namespaceColor;
  const selectedOverlayStyle = {
    "--badge-overlay": selectedColor,
  } as CSSProperties;

  const selectedLabel = isNamespaceSort
    ? "namespaces"
    : getSortOption(value.sortType).label;

  useEffect(() => {
    if (!open) {
      setSearch("");
      setActivePage(null);
    }
  }, [open]);

  const selectSystemSort = (sortType: HydrusFileSortType) => {
    onChange({
      sortType,
      sortAsc: getDefaultSortAsc(sortType),
    });
    setOpen(false);
  };

  const selectNamespaceSortType = () => {
    onChange({
      mode: "namespaces",
      namespaces: isNamespaceSort ? value.namespaces : [],
      sortAsc: isNamespaceSort ? value.sortAsc : true,
    });
    setOpen(false);
  };

  const isSearching = search.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 max-w-2xl min-w-40 flex-1 basis-40 cursor-pointer items-center justify-between gap-1.5 rounded-lg border px-3 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:opacity-50",
          "border-(--badge-overlay)/30 bg-[color-mix(in_srgb,var(--badge-overlay)_20%,transparent)] text-(--badge-overlay) hover:bg-[color-mix(in_srgb,var(--badge-overlay)_25%,transparent)]",
        )}
        style={selectedOverlayStyle}
        aria-label="Sort by"
      >
        <span className="truncate">{selectedLabel}</span>
        <IconChevronDown
          className={cn("size-4 shrink-0", "text-(--badge-overlay)")}
        />
      </PopoverTrigger>
      <PopoverContent
        className="max-h-(--sort-dropdown-max-height) w-80 max-w-[calc(100dvw-1rem)] overflow-hidden p-0"
        style={SORT_DROPDOWN_HEIGHT_STYLE}
        align="end"
        side="bottom"
        positionMethod="fixed"
      >
        <Command
          className="max-h-(--sort-dropdown-max-height)"
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
          <CommandList className="max-h-(--sort-dropdown-list-max-height) min-h-0 flex-1">
            <CommandEmpty>No results.</CommandEmpty>
            {isSearching ? (
              <>
                {SORT_GROUPS.map((group) => (
                  <CommandGroup key={group.label} heading={group.label}>
                    {group.options.map((sortType) => {
                      const opt = getSortOption(sortType);

                      return (
                        <CommandItem
                          key={opt.value}
                          value={opt.label}
                          keywords={[group.label, opt.label]}
                          data-checked={
                            selectedSystemSortType === opt.value || undefined
                          }
                          onSelect={() => selectSystemSort(opt.value)}
                        >
                          <SortOptionLabel sortType={opt.value} />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))}
                <CommandGroup heading="namespaces">
                  <CommandItem
                    value="namespaces"
                    keywords={["namespaces", "namespace", "tags"]}
                    data-checked={isNamespaceSort || undefined}
                    onSelect={selectNamespaceSortType}
                  >
                    namespaces
                  </CommandItem>
                </CommandGroup>
              </>
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
                          data-checked={
                            selectedSystemSortType === opt.value || undefined
                          }
                          onSelect={() => selectSystemSort(opt.value)}
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
                        group.options.some(
                          (option) => option === selectedSystemSortType,
                        ) || undefined
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
                <CommandItem
                  key="namespaces"
                  value="namespaces"
                  data-checked={isNamespaceSort || undefined}
                  onSelect={selectNamespaceSortType}
                >
                  namespaces
                </CommandItem>
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
                        data-checked={
                          selectedSystemSortType === opt.value || undefined
                        }
                        onSelect={() => selectSystemSort(opt.value)}
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

function NamespaceSortSelect({
  value,
  onChange,
}: {
  value: Extract<SortConfig, { mode: "namespaces" }>;
  onChange: (value: SortConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    formatNamespaceSortValue(value.namespaces),
  );
  const namespaceSorts = useDefaultNamespaceSorts();
  const presetOptions = namespaceSorts.map((sort) => ({
    label: formatNamespaceSortValue(sort.namespaces),
    namespaces: sort.namespaces,
    sortAsc: sort.sort_order !== 1,
  }));
  const customNamespaces = parseNamespaceSortValue(inputValue);
  const customLabel = formatNamespaceSortValue(customNamespaces);
  const inputIsEmpty = inputValue.trim().length === 0;
  const showCustomOption =
    !inputIsEmpty &&
    customNamespaces.length > 0 &&
    !presetOptions.some((option) => option.label === customLabel);
  const showDropdown = open && (presetOptions.length > 0 || showCustomOption);

  useEffect(() => {
    if (!open) setInputValue(formatNamespaceSortValue(value.namespaces));
  }, [open, value.namespaces]);

  const selectNamespaceSort = (
    namespaces: Array<string>,
    sortAsc = value.sortAsc,
  ) => {
    if (namespaces.length === 0 && !inputIsEmpty) return;
    setInputValue(formatNamespaceSortValue(namespaces));
    onChange({
      mode: "namespaces",
      namespaces,
      sortAsc,
    });
    setOpen(false);
  };

  const submitTypedValue = () => {
    if (inputIsEmpty || customNamespaces.length > 0) {
      selectNamespaceSort(customNamespaces);
    }
  };

  return (
    <div className="flex max-w-4xl min-w-64 flex-[2_1_24rem] flex-wrap items-center gap-2">
      <div className="relative min-w-64 flex-1 basis-96">
        <Input
          className="h-9 w-full"
          aria-label="Namespace sort"
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            setOpen(true);
          }}
          onPointerDown={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            submitTypedValue();
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (inputIsEmpty || customNamespaces.length > 0)
            ) {
              event.preventDefault();
              submitTypedValue();
            }
          }}
          autoComplete="off"
        />
        {showDropdown && (
          <div
            className="bg-popover border-border ring-foreground/5 absolute top-full left-0 z-50 mt-1 w-[min(42rem,calc(100dvw-1rem))] min-w-full overflow-hidden rounded-lg border shadow-md ring-1"
            onPointerDown={(event) => event.preventDefault()}
          >
            <Command shouldFilter={false}>
              <CommandList className="max-h-72">
                {showCustomOption && (
                  <CommandGroup heading="custom">
                    <CommandItem
                      value={`custom ${customLabel}`}
                      keywords={[customLabel]}
                      className="h-auto items-center gap-2 py-1.5"
                      onSelect={() => selectNamespaceSort(customNamespaces)}
                    >
                      <span className="text-muted-foreground shrink-0">
                        Use
                      </span>
                      <NamespaceSortBadge
                        namespaces={customNamespaces}
                        size="xs"
                        compact
                        className={NAMESPACE_SORT_COMMAND_BADGE_CLASSNAME}
                      />
                    </CommandItem>
                  </CommandGroup>
                )}
                <CommandGroup heading="preset namespaces">
                  {presetOptions.length > 0 ? (
                    presetOptions.map((option) => (
                      <CommandItem
                        key={option.label}
                        value={option.label}
                        keywords={[option.label]}
                        className="h-auto py-1.5"
                        data-checked={
                          formatNamespaceSortValue(value.namespaces) ===
                          option.label
                            ? true
                            : undefined
                        }
                        onSelect={() =>
                          selectNamespaceSort(option.namespaces, option.sortAsc)
                        }
                      >
                        <NamespaceSortBadge
                          namespaces={option.namespaces}
                          size="xs"
                          compact
                          className={NAMESPACE_SORT_COMMAND_BADGE_CLASSNAME}
                        />
                      </CommandItem>
                    ))
                  ) : (
                    <div className="text-muted-foreground px-2 py-1.5 text-sm">
                      No preset namespaces.
                    </div>
                  )}
                </CommandGroup>
                <p className="text-muted-foreground px-2 pb-2 text-xs/5">
                  Separate custom namespaces with dashes. Escape a dash inside a
                  namespace with a backslash, like creator\-id-page.
                </p>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    </div>
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
      style={{ "--badge-overlay": color }}
    >
      <span className="size-2.5 rounded-full bg-(--badge-overlay)" />
      {option.label}
    </span>
  );
}
