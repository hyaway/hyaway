// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconBackslash,
  IconChevronDown,
  IconChevronRight,
  IconMinus,
  IconPlus,
  IconPlusMinus,
  IconTrash,
} from "@tabler/icons-react";
import { defaultFilter } from "cmdk";
import { isOptionGroupArray, useValueSelector } from "react-querybuilder";
import {
  FIELD_SEARCH_KEYWORDS,
  getFieldHydrusLabel,
  isNoValueField,
} from "../-lib/query-builder-fields";
import type {
  ActionProps,
  ValueEditorProps,
  VersatileSelectorProps,
} from "react-querybuilder";
import type { CSSProperties } from "react";
import type {
  RatingServiceInfo,
  StarShape,
} from "@/integrations/hydrus-api/models";
import {
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";
import {
  getDislikeColors,
  getIncDecPositiveColors,
  getLikeColors,
  getNumericalFilledColors,
} from "@/components/ratings/rating-colors";
import { NumericalRatingControl } from "@/components/ratings/rating-controls";
import { Button } from "@/components/ui-primitives/button";
import { Switch } from "@/components/ui-primitives/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui-primitives/command";
import { Input } from "@/components/ui-primitives/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import { cn } from "@/lib/utils";
import { getThemeAdjustedColorFromHex } from "@/lib/color-utils";
import { parseTag } from "@/lib/tag-utils";
import { useActiveTheme } from "@/stores/theme-store";
import {
  useFavouriteTagsQuery,
  useSearchTagsQuery,
} from "@/integrations/hydrus-api/queries/tags";
import { useNamespaceColors } from "@/integrations/hydrus-api/queries/options";

// ---------------------------------------------------------------------------
// Field selector
// ---------------------------------------------------------------------------

/** Field selector — QBSelect with namespace colors enabled. */
export function QBFieldSelect(props: VersatileSelectorProps) {
  return <QBSelect {...props} colorLabels />;
}

// ---------------------------------------------------------------------------
// Operator selector
// ---------------------------------------------------------------------------

/** Operator selector — hides for 1 option, switch for 2, combobox for 3+ */
export function QBOperatorSelect(props: VersatileSelectorProps) {
  const flatOptions = isOptionGroupArray(props.options)
    ? (props.options as Array<{ options: Array<unknown> }>).flatMap(
        (g) => g.options,
      )
    : (props.options as Array<{ name: string; label: string }>);

  if (flatOptions.length <= 1) return null;

  // Two options → toggle switch with labels
  if (flatOptions.length === 2) {
    const [first, second] = flatOptions as Array<{
      name: string;
      label: string;
    }>;
    const isFirst = props.value === first.name;
    return (
      <div className="inline-flex items-center gap-1.5 px-1.5">
        <span
          className={cn(
            "text-sm transition-colors",
            !isFirst ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {second.label}
        </span>
        <Switch
          size="default"
          checked={isFirst}
          onCheckedChange={(checked) =>
            props.handleOnChange(checked ? first.name : second.name)
          }
          disabled={props.disabled}
        />
        <span
          className={cn(
            "text-sm transition-colors",
            isFirst ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {first.label}
        </span>
      </div>
    );
  }

  return <QBSelect {...props} />;
}

// ---------------------------------------------------------------------------
// Main select combobox
// ---------------------------------------------------------------------------

/** Combobox using Popover + Command — used for field + operator.
 *  For grouped options (field selector): shows categories first, drill into a
 *  category to see its fields. Typing in search searches everything flat.
 *  For flat options (operator selector): shows all options directly.
 */
export function QBSelect({
  handleOnChange,
  options,
  value,
  title,
  disabled,
  className,
  colorLabels,
}: VersatileSelectorProps & { colorLabels?: boolean }) {
  const [open, setOpen] = useState(false);
  /** The currently drilled-into group label, or null for the top-level view. */
  const [activePage, setActivePage] = useState<string | null>(null);
  /** Track whether the user has typed anything in the search input. */
  const [search, setSearch] = useState("");

  const { onChange, val } = useValueSelector({
    handleOnChange,
    listsAsArrays: false,
    multiple: false,
    value,
  });

  // Reset drill-down state when popover closes
  useEffect(() => {
    if (!open) {
      setActivePage(null);
      setSearch("");
    }
  }, [open]);

  type OptionItem = { name: string; label: string };
  type OptionGroupItem = {
    label: string;
    inline?: boolean;
    options: Array<OptionItem>;
  };

  const isGrouped = isOptionGroupArray(options);
  const groups = isGrouped ? (options as Array<OptionGroupItem>) : null;
  const namespaceColors = useNamespaceColors();

  /** Get inline color style for a label based on its namespace. */
  const labelStyle = (label: string): CSSProperties | undefined => {
    const { namespace } = parseTag(label);
    const color =
      namespaceColors[namespace || "null"] ?? namespaceColors["null"];
    return color ? { color } : undefined;
  };

  // Resolve the display label for the current value
  const selectedLabel = useMemo(() => {
    if (groups) {
      for (const og of groups) {
        const found = og.options.find((o) => o.name === val);
        if (found) {
          return getFieldHydrusLabel(found.name);
        }
      }
    } else {
      const found = (options as Array<OptionItem>).find((o) => o.name === val);
      if (found) return found.label;
    }
    return null;
  }, [options, groups, val]);

  const selectField = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  // When typing, show flat search across all fields.
  // When not typing and on top-level, show group headings as selectable items.
  // When drilled into a page, show that page's options.
  const isSearching = search.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border px-3 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:opacity-50 lg:w-auto lg:max-w-96 lg:min-w-60",
          className,
        )}
        aria-label={title}
      >
        <span
          className="truncate"
          style={
            colorLabels && selectedLabel ? labelStyle(selectedLabel) : undefined
          }
        >
          {selectedLabel ?? title ?? "Select…"}
        </span>
        <IconChevronDown className="text-muted-foreground size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[70dvh] w-80 p-0"
        align="start"
        side="right"
        alignOffset={-4}
        sideOffset={-240}
        positionMethod="fixed"
      >
        <Command
          shouldFilter={isSearching}
          filter={(itemValue, searchTerm, keywords) => {
            // Short queries: exact substring match only (no fuzzy).
            // Longer queries: fuzzy with a minimum score threshold.
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
            placeholder={`Search ${title?.toLowerCase() ?? ""}…`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-none">
            <CommandEmpty>No results.</CommandEmpty>
            {groups ? (
              isSearching ? (
                // Flat search across all groups
                groups.map((og) => (
                  <CommandGroup key={og.label} heading={og.label}>
                    {og.options.map((opt) => (
                      <CommandItem
                        key={opt.name}
                        value={opt.name}
                        keywords={[
                          opt.label,
                          // Include group label as keyword only for
                          // non-inline groups so users can search by
                          // category (e.g. "dimensions" finds "width").
                          // Inline groups use a generic label like
                          // "basics" that would cause fuzzy false
                          // positives.
                          ...(og.inline ? [] : [og.label]),
                          getFieldHydrusLabel(opt.name),
                          ...(FIELD_SEARCH_KEYWORDS[opt.name] ?? []),
                        ]}
                        data-checked={val === opt.name}
                        onSelect={() => selectField(opt.name)}
                      >
                        <span style={labelStyle(getFieldHydrusLabel(opt.name))}>
                          {getFieldHydrusLabel(opt.name)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))
              ) : activePage === null ? (
                // Top-level: inline groups (single-option or marked inline)
                // render their options directly; others are drill-down categories
                <CommandGroup>
                  {[...groups]
                    .sort(
                      (a, b) =>
                        (a.inline || a.options.length === 1 ? 0 : 1) -
                        (b.inline || b.options.length === 1 ? 0 : 1),
                    )
                    .flatMap((og) =>
                      og.inline || og.options.length === 1 ? (
                        og.options.map((opt) => (
                          <CommandItem
                            key={opt.name}
                            value={opt.name}
                            keywords={[opt.label, og.label]}
                            data-checked={val === opt.name}
                            onSelect={() => selectField(opt.name)}
                          >
                            <span
                              style={labelStyle(getFieldHydrusLabel(opt.name))}
                            >
                              {getFieldHydrusLabel(opt.name)}
                            </span>
                          </CommandItem>
                        ))
                      ) : (
                        <CommandItem
                          key={og.label}
                          value={og.label}
                          data-checked={og.options.some((o) => o.name === val)}
                          onSelect={() => setActivePage(og.label)}
                        >
                          <span className="flex-1" style={labelStyle(og.label)}>
                            {og.label}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {og.options.length}
                          </span>
                          <IconChevronRight className="text-muted-foreground size-3.5" />
                        </CommandItem>
                      ),
                    )}
                </CommandGroup>
              ) : (
                // Drilled into a specific group
                <>
                  <CommandGroup>
                    <CommandItem
                      value="__back"
                      onSelect={() => setActivePage(null)}
                    >
                      <IconArrowLeft className="text-muted-foreground size-3.5" />
                      <span className="text-muted-foreground">
                        {activePage}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandGroup>
                    {groups
                      .find((og) => og.label === activePage)
                      ?.options.map((opt) => (
                        <CommandItem
                          key={opt.name}
                          value={opt.name}
                          keywords={[
                            opt.label,
                            ...(FIELD_SEARCH_KEYWORDS[opt.name] ?? []),
                          ]}
                          data-checked={val === opt.name}
                          onSelect={() => selectField(opt.name)}
                        >
                          <span
                            style={labelStyle(getFieldHydrusLabel(opt.name))}
                          >
                            {getFieldHydrusLabel(opt.name)}
                          </span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </>
              )
            ) : (
              // Flat options (operator selector)
              (options as Array<OptionItem>).map((opt) => (
                <CommandItem
                  key={opt.name}
                  value={opt.name}
                  keywords={[opt.label]}
                  data-checked={val === opt.name}
                  onSelect={() => selectField(opt.name)}
                >
                  {opt.label}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

/** Action button using our Button primitive */
export function QBActionElement({
  handleOnClick,
  label,
  title,
  disabled,
  disabledTranslation,
  className,
  level,
}: ActionProps) {
  const isRemove =
    typeof label === "string" && (label === "⨯" || title?.includes("Remove"));
  const isAddGroup = typeof label === "string" && label.includes("Group");

  if (isRemove) {
    return (
      <Button
        variant="ghost"
        size="default"
        className={cn(
          "text-muted-foreground hover:text-destructive",
          className,
        )}
        title={
          disabledTranslation && disabled ? disabledTranslation.title : title
        }
        onClick={(e) => handleOnClick(e)}
        disabled={disabled && !disabledTranslation}
        type="button"
      >
        <IconTrash data-icon="inline-start" className="size-5" />
        {title?.includes("group") ? "Remove group" : "Remove"}
      </Button>
    );
  }

  if (isAddGroup) {
    // Only allow adding OR groups at root level (level 0).
    // Sub-groups (level >= 1) cannot have nested groups.
    if (level > 0) return null;
    return (
      <Button
        variant="outline"
        size="default"
        className={className}
        title={title}
        onClick={(e) => handleOnClick(e)}
        disabled={disabled}
        type="button"
      >
        <IconPlus data-icon="inline-start" className="size-5" />
        Add OR group
      </Button>
    );
  }

  // Add rule: show separate "Add tag" and "Add filter" buttons
  return (
    <>
      <Button
        variant="outline"
        size="default"
        className={className}
        onClick={(e) => handleOnClick(e, { addTag: true })}
        disabled={disabled}
        type="button"
      >
        <IconPlus data-icon="inline-start" className="size-5" />
        Add tag
      </Button>
      <Button
        variant="outline"
        size="default"
        className={className}
        onClick={(e) => handleOnClick(e, { addSystem: true })}
        disabled={disabled}
        type="button"
      >
        <IconPlus data-icon="inline-start" className="size-5" />
        Add system
      </Button>
      <Button
        variant="outline"
        size="default"
        className={className}
        onClick={(e) => handleOnClick(e, { addLimit: true })}
        disabled={disabled}
        type="button"
      >
        <IconPlus data-icon="inline-start" className="size-5" />
        Add limit
      </Button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Value editor
// ---------------------------------------------------------------------------

/** Value editor using our Input primitive */
export function QBValueEditor(props: ValueEditorProps) {
  const { field, fieldData, value, handleOnChange, values, title, disabled } =
    props;
  const operator = props.rule.operator;

  // Has/does-not-have fields and no-value operators need no value input
  if (isNoValueField(field, operator)) {
    return null;
  }

  // Rating fields — render type-specific value editors with icons
  if (field.startsWith("rating:") && fieldData.ratingService) {
    const service = fieldData.ratingService as RatingServiceInfo;
    const serviceKey = fieldData.ratingServiceKey as string;

    if (isLikeRatingService(service)) {
      return (
        <LikeDislikeValueEditor
          value={value}
          onChange={handleOnChange}
          serviceKey={serviceKey}
          service={service}
          disabled={disabled}
        />
      );
    }

    if (isNumericalRatingService(service)) {
      return (
        <NumericalValueEditor
          value={value}
          onChange={handleOnChange}
          serviceKey={serviceKey}
          service={service}
          disabled={disabled}
        />
      );
    }

    // Inc/Dec — plain number input with service icon
    return (
      <IncDecValueEditor
        value={value}
        onChange={handleOnChange}
        service={service}
        disabled={disabled}
      />
    );
  }

  // Tag field — plain text input (user types the tag)
  if (field === "tag") {
    return (
      <TagValueEditor
        value={value ?? ""}
        onChange={handleOnChange}
        disabled={disabled}
      />
    );
  }

  // Select-based value editors
  if (fieldData.valueEditorType === "select" && values) {
    return (
      <QBSelect
        handleOnChange={handleOnChange}
        options={values}
        value={value ?? ""}
        title={title}
        disabled={disabled}
        path={props.path}
        level={props.level}
        schema={props.schema}
        rule={props.rule}
      />
    );
  }

  return (
    <Input
      type={fieldData.inputType === "number" ? "number" : "text"}
      className="w-full lg:w-auto lg:max-w-96 lg:min-w-40"
      name={`hyaway-spb-${field}`}
      value={value ?? ""}
      disabled={disabled}
      title={title}
      autoComplete="off"
      onChange={(e) => handleOnChange(e.target.value)}
    />
  );
}

// ---------------------------------------------------------------------------
// Rating value editors
// ---------------------------------------------------------------------------

/** Like/dislike value: two icon toggle buttons for liked / disliked */
function LikeDislikeValueEditor({
  value,
  onChange,
  serviceKey,
  service,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  serviceKey: string;
  service: RatingServiceInfo;
  disabled?: boolean;
}) {
  const { filled: FilledIcon, outline: OutlineIcon } = useShapeIcons(
    serviceKey,
    service.star_shape,
  );
  const likeColors = getLikeColors(service);
  const dislikeColors = getDislikeColors(service);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn("size-9 p-0", value === "liked" && "bg-muted")}
        onClick={() => onChange("liked")}
        disabled={disabled}
        aria-label="Liked"
        aria-pressed={value === "liked"}
        type="button"
      >
        {value === "liked" ? (
          <FilledIcon
            className="size-5"
            style={{ color: likeColors.brush, stroke: likeColors.pen }}
            strokeWidth={1.5}
          />
        ) : (
          <OutlineIcon className="size-5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn("size-9 p-0", value === "disliked" && "bg-muted")}
        onClick={() => onChange("disliked")}
        disabled={disabled}
        aria-label="Disliked"
        aria-pressed={value === "disliked"}
        type="button"
      >
        <span
          className="relative"
          style={
            value === "disliked"
              ? { color: dislikeColors.brush, stroke: dislikeColors.pen }
              : undefined
          }
        >
          {value === "disliked" ? (
            <FilledIcon className="size-5" strokeWidth={1.5} />
          ) : (
            <OutlineIcon className="size-5" />
          )}
          <IconBackslash
            className="text-background pointer-events-none absolute -inset-1.5 size-8"
            strokeWidth={3}
          />
          <IconBackslash
            className="pointer-events-none absolute -inset-1.5 size-8"
            style={
              value === "disliked" ? { color: dislikeColors.brush } : undefined
            }
            strokeWidth={1.5}
          />
        </span>
      </Button>
    </div>
  );
}

/** Numerical rating value: star picker using NumericalRatingControl */
function NumericalValueEditor({
  value,
  onChange,
  serviceKey,
  service,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  serviceKey: string;
  service: RatingServiceInfo;
  disabled?: boolean;
}) {
  const numValue = value === "" ? null : Number(value);
  const filledColors = getNumericalFilledColors(service);
  const svc = service as {
    min_stars: number;
    max_stars: number;
    star_shape: StarShape;
  };

  return (
    <NumericalRatingControl
      value={numValue}
      minStars={svc.min_stars}
      maxStars={svc.max_stars}
      serviceKey={serviceKey}
      starShape={svc.star_shape}
      onChange={(v) => onChange(v === null ? "" : String(v))}
      disabled={disabled}
      size="compact"
      filledColors={filledColors}
    />
  );
}

/** Inc/Dec rating value: +/- control with editable middle field */
function IncDecValueEditor({
  value,
  onChange,
  service,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  service: RatingServiceInfo;
  disabled?: boolean;
}) {
  const numValue = value === "" ? 0 : Number(value);
  const theme = useActiveTheme();
  const incDecColors = getIncDecPositiveColors(service);
  const incDecOverlayColor = getThemeAdjustedColorFromHex(
    incDecColors?.brush,
    theme,
  );

  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label={`Rating: ${numValue}`}
    >
      <Button
        variant="outline"
        size="default"
        className="size-9 p-0"
        onClick={() => onChange(String(Math.max(0, numValue - 1)))}
        disabled={disabled || numValue <= 0}
        aria-label="Decrease"
      >
        <IconMinus aria-hidden className="size-5" />
      </Button>
      <Input
        type="number"
        min={0}
        className={cn(
          "h-9 w-16 [appearance:textfield] rounded-lg text-center tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          incDecOverlayColor &&
            "border-(--badge-overlay)/50 text-(--badge-overlay)",
        )}
        style={
          incDecOverlayColor
            ? ({ "--badge-overlay": incDecOverlayColor } as CSSProperties)
            : undefined
        }
        value={numValue}
        onChange={(e) => {
          const v = e.target.value === "" ? "0" : e.target.value;
          const n = Math.max(0, Number(v));
          onChange(String(Number.isNaN(n) ? 0 : n));
        }}
        disabled={disabled}
      />
      <Button
        variant="outline"
        size="default"
        className="size-9 p-0"
        onClick={() => onChange(String(numValue + 1))}
        disabled={disabled}
        aria-label="Increase"
      >
        <IconPlus aria-hidden className="size-5" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag value editor
// ---------------------------------------------------------------------------

/** Tag value editor with autocomplete from the hydrus API */
function TagValueEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedInput, setDebouncedInput] = useState(value);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedInput(inputValue);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  const { data } = useSearchTagsQuery(
    debouncedInput.replace(/^-+/, "").replace(/:$/, ""),
  );
  const { data: favouritesData } = useFavouriteTagsQuery();
  const suggestions = data?.tags.slice(0, 50) ?? [];
  const isNegated = inputValue.trimStart().startsWith("-");
  const hasSufficientInput = inputValue.trim().replace(/^-+/, "").length >= 3;
  const favouriteTags = favouritesData?.favourite_tags ?? [];
  const showFavourites =
    open && !hasSufficientInput && favouriteTags.length > 0;
  const showDropdown =
    (open && hasSufficientInput && suggestions.length > 0) || showFavourites;

  const namespaceColors = useNamespaceColors();
  const { namespace } = parseTag(inputValue);
  const inputColor = namespace
    ? (namespaceColors[namespace] ?? namespaceColors["null"])
    : undefined;

  const handleSelect = useCallback(
    (tag: string) => {
      const selected = isNegated ? `-${tag}` : tag;
      setInputValue(selected);
      onChange(selected);
      setOpen(false);
    },
    [onChange, isNegated],
  );

  return (
    <>
      <div className="relative w-full lg:w-auto lg:max-w-96 lg:min-w-48 lg:flex-1">
        <Input
          className="w-full"
          style={inputColor ? { color: inputColor } : undefined}
          value={inputValue}
          disabled={disabled}
          placeholder="e.g. cat or -cat"
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
          }}
          name={`hyaway-spb-tag`}
          autoComplete="off"
        />
        {showDropdown && (
          <div className="bg-popover border-border ring-foreground/5 absolute top-full left-0 z-50 mt-1 w-full min-w-64 overflow-hidden rounded-lg border shadow-md ring-1">
            <Command shouldFilter={false}>
              <CommandList>
                {hasSufficientInput
                  ? suggestions.map((tag) => (
                      <TagSuggestionItem
                        key={tag.value}
                        value={tag.value}
                        negated={isNegated}
                        count={tag.count}
                        onSelect={() => handleSelect(tag.value)}
                      />
                    ))
                  : favouriteTags.map((tag) => (
                      <TagSuggestionItem
                        key={tag}
                        value={tag}
                        negated={isNegated}
                        onSelect={() => handleSelect(tag)}
                      />
                    ))}
              </CommandList>
            </Command>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="default"
        className="shrink-0"
        onClick={() => {
          const toggled = isNegated
            ? inputValue.replace(/^-/, "")
            : `-${inputValue}`;
          setInputValue(toggled);
          onChange(toggled);
        }}
        disabled={disabled}
        type="button"
      >
        <IconPlusMinus data-icon="inline-start" className="size-5" />
        {isNegated ? "Include" : "Exclude"}
      </Button>
    </>
  );
}

function TagSuggestionItem({
  value,
  negated,
  count,
  onSelect,
}: {
  value: string;
  negated?: boolean;
  count?: number;
  onSelect: () => void;
}) {
  const namespaceColors = useNamespaceColors();
  const { namespace } = parseTag(value);
  const color = namespaceColors[namespace] ?? namespaceColors["null"];

  const style: CSSProperties | undefined = color ? { color } : undefined;

  return (
    <CommandItem value={value} onSelect={onSelect}>
      <span className="min-w-0 flex-1 truncate" style={style}>
        {negated ? "-" : ""}
        {value}
      </span>
      {count != null && (
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {count.toLocaleString()}
        </span>
      )}
    </CommandItem>
  );
}

// ---------------------------------------------------------------------------
// Combinator selector
// ---------------------------------------------------------------------------

export function QBCombinatorSelect(props: VersatileSelectorProps) {
  const { level } = props;
  // Root level is always AND, sub-groups are always OR — no toggle needed.
  // Show a static label so the user sees the relationship.
  if (level === 0) {
    return (
      <span className="text-muted-foreground px-1 text-sm font-medium">
        and
      </span>
    );
  }
  return (
    <span className="text-muted-foreground px-1 text-sm font-medium">or</span>
  );
}

// ---------------------------------------------------------------------------
// Classnames for QueryBuilder layout
// ---------------------------------------------------------------------------

export const controlClassnames = {
  queryBuilder: "",
  ruleGroup:
    "qb-group flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/20 p-2 [&_.qb-group]:ml-1 [&_.qb-group]:rounded-none [&_.qb-group]:border-0 [&_.qb-group]:border-l-4 [&_.qb-group]:border-l-primary",
  header: "order-last flex flex-wrap items-center gap-2",
  body: "flex flex-col gap-0",
  rule: "flex flex-wrap items-center gap-2",
  combinators: "",
  betweenRules: "my-2 md:my-1 self-center lg:self-start",
  dragHandle: "hidden",
  notToggle: "hidden",
  lock: "hidden",
  cloneGroup: "hidden",
  cloneRule: "hidden",
  shiftActions: "hidden",
  valueSource: "hidden",
};
