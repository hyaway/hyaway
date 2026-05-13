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
  SYSTEM_TAGS,
  fieldGroups,
  getFieldHydrusLabel,
  isNoValueField,
  systemTagToRule,
} from "../-lib/query-builder-fields";
import type {
  ActionProps,
  Field,
  OptionGroup,
  RuleGroupTypeAny,
  RuleType,
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
import { Button, buttonVariants } from "@/components/ui-primitives/button";
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
import { TagAutocompleteInput } from "@/components/tag/tag-autocomplete-input";
import { useNamespaceColors } from "@/integrations/hydrus-api/queries/options";

// ---------------------------------------------------------------------------
// Field selector
// ---------------------------------------------------------------------------

/** Field selector — QBSelect with namespace colors enabled.
 *  Hides entirely for tag rules (added via "Add tag" button).
 */
export function QBFieldSelect(props: VersatileSelectorProps) {
  if (props.value === "tag") return null;

  const currentOperator = props.rule?.operator;
  const selectedSystemTag = SYSTEM_TAGS.find((tag) => {
    const rule = systemTagToRule(tag);
    return rule?.field === props.value && rule?.operator === currentOperator;
  });

  const filtered = useMemo(() => {
    if (!isOptionGroupArray(props.options)) return props.options;
    return (props.options as Array<OptionGroup<Field>>)
      .map((group) => ({
        ...group,
        options: group.options
          .filter((o) => o.name !== "tag")
          .flatMap((o) => {
            const systemPredicateOptions = SYSTEM_TAGS.filter((tag) => {
              const rule = systemTagToRule(tag);
              return rule?.field === o.name;
            }).map((tag) => ({ ...o, name: tag, label: tag }));

            return systemPredicateOptions.length > 1
              ? systemPredicateOptions
              : [o];
          }),
      }))
      .filter((group) => group.options.length > 0);
  }, [props.options]);
  return (
    <QBSelect
      {...props}
      options={filtered as typeof props.options}
      displayValue={selectedSystemTag}
      colorLabels
    />
  );
}

// ---------------------------------------------------------------------------
// Operator selector
// ---------------------------------------------------------------------------

/** Operator selector — hides for 1 option, negate button for 2, combobox for 3+ */
export function QBOperatorSelect(props: VersatileSelectorProps) {
  const flatOptions = isOptionGroupArray(props.options)
    ? (props.options as Array<{ options: Array<unknown> }>).flatMap(
        (g) => g.options,
      )
    : (props.options as Array<{ name: string; label: string }>);

  if (flatOptions.length <= 1) return null;

  // Two options -> show the selected predicate and a negate action.
  if (flatOptions.length === 2) {
    const [first, second] = flatOptions as Array<{
      name: string;
      label: string;
    }>;
    const selected = props.value === second.name ? second : first;
    const next = props.value === second.name ? first : second;
    const hasSystemPredicateChoices =
      typeof props.rule?.field === "string" &&
      first.name === "has" &&
      second.name === "has_not" &&
      SYSTEM_TAGS.filter(
        (tag) => systemTagToRule(tag)?.field === props.rule?.field,
      ).length > 1;

    return (
      <div className="inline-flex min-w-0 items-center gap-1.5">
        {!hasSystemPredicateChoices && (
          <span className="min-w-0 truncate px-1.5 text-sm">
            {selected.label}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={() => props.handleOnChange(next.name)}
          disabled={props.disabled}
          type="button"
          title={`Change to ${next.label}`}
          aria-label={`Negate: change to ${next.label}`}
        >
          <IconPlusMinus className="size-5" />
        </Button>
      </div>
    );
  }

  return <QBSelect {...props} />;
}

// ---------------------------------------------------------------------------
// Main select combobox
// ---------------------------------------------------------------------------

type OptionItem = { name: string; label: string };
type OptionGroupItem = {
  label: string;
  inline?: boolean;
  options: Array<OptionItem>;
};

/**
 * Shared drill-down Command content used by both QBSelect and
 * SystemFieldCombobox. Renders grouped options with category drill-down,
 * fuzzy search, and namespace-colored labels.
 */
function DrillDownCommandContent({
  groups,
  flatOptions,
  selectedValue,
  searchPlaceholder,
  onSelect,
}: {
  groups: Array<OptionGroupItem> | null;
  flatOptions: Array<OptionItem> | null;
  selectedValue?: string;
  searchPlaceholder?: string;
  onSelect: (name: string) => void;
}) {
  const [activePage, setActivePage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const namespaceColors = useNamespaceColors();

  const labelStyle = (label: string): CSSProperties | undefined => {
    const { namespace } = parseTag(label);
    const color =
      namespaceColors[namespace || "null"] ?? namespaceColors["null"];
    return color ? { color } : undefined;
  };

  const optionLabel = (option: OptionItem) =>
    option.name.startsWith("system:")
      ? option.label
      : getFieldHydrusLabel(option.name);

  const isSearching = search.length > 0;

  return (
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
        placeholder={searchPlaceholder ?? "Search…"}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-none">
        <CommandEmpty>No results.</CommandEmpty>
        {groups ? (
          isSearching ? (
            groups.map((og) => (
              <CommandGroup key={og.label} heading={og.label}>
                {og.options.map((opt) => (
                  <CommandItem
                    key={opt.name}
                    value={opt.name}
                    keywords={[
                      optionLabel(opt),
                      ...(og.inline ? [] : [og.label]),
                      getFieldHydrusLabel(opt.name),
                      ...(FIELD_SEARCH_KEYWORDS[opt.name] ?? []),
                    ]}
                    data-checked={selectedValue === opt.name || undefined}
                    onSelect={() => onSelect(opt.name)}
                  >
                    <span style={labelStyle(optionLabel(opt))}>
                      {optionLabel(opt)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          ) : activePage === null ? (
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
                        keywords={[optionLabel(opt), og.label]}
                        data-checked={selectedValue === opt.name || undefined}
                        onSelect={() => onSelect(opt.name)}
                      >
                        <span style={labelStyle(optionLabel(opt))}>
                          {optionLabel(opt)}
                        </span>
                      </CommandItem>
                    ))
                  ) : (
                    <CommandItem
                      key={og.label}
                      value={og.label}
                      data-checked={
                        og.options.some((o) => o.name === selectedValue) ||
                        undefined
                      }
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
                {groups
                  .find((og) => og.label === activePage)
                  ?.options.map((opt) => (
                    <CommandItem
                      key={opt.name}
                      value={opt.name}
                      keywords={[
                        optionLabel(opt),
                        ...(FIELD_SEARCH_KEYWORDS[opt.name] ?? []),
                      ]}
                      data-checked={selectedValue === opt.name || undefined}
                      onSelect={() => onSelect(opt.name)}
                    >
                      <span style={labelStyle(optionLabel(opt))}>
                        {optionLabel(opt)}
                      </span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </>
          )
        ) : flatOptions ? (
          flatOptions.map((opt) => (
            <CommandItem
              key={opt.name}
              value={opt.name}
              keywords={[opt.label]}
              data-checked={selectedValue === opt.name || undefined}
              onSelect={() => onSelect(opt.name)}
            >
              {opt.label}
            </CommandItem>
          ))
        ) : null}
      </CommandList>
    </Command>
  );
}

/** Combobox using Popover + Command — used for field + operator.
 *  For grouped options (field selector): shows categories first, drill into a
 *  category to see its fields. Typing in search searches everything flat.
 *  For flat options (operator selector): shows all options directly.
 */
export function QBSelect({
  handleOnChange,
  options,
  value,
  displayValue,
  title,
  disabled,
  className,
  colorLabels,
  rule,
  schema,
}: VersatileSelectorProps & { colorLabels?: boolean; displayValue?: string }) {
  const [open, setOpen] = useState(false);

  const { onChange, val } = useValueSelector({
    handleOnChange,
    listsAsArrays: false,
    multiple: false,
    value,
  });

  const isGrouped = isOptionGroupArray(options);
  const groups = isGrouped ? (options as Array<OptionGroupItem>) : null;
  const flatOptions = !isGrouped ? (options as Array<OptionItem>) : null;
  const namespaceColors = useNamespaceColors();

  const overlayStyle = (label: string): CSSProperties | undefined => {
    const { namespace } = parseTag(label);
    const color =
      namespaceColors[namespace || "null"] ?? namespaceColors["null"];
    return color ? ({ "--badge-overlay": color } as CSSProperties) : undefined;
  };

  const selectedLabel = useMemo(() => {
    if (groups) {
      for (const og of groups) {
        const found = og.options.find((o) => o.name === val);
        if (found) return getFieldHydrusLabel(found.name);
      }
    } else if (flatOptions) {
      const found = flatOptions.find((o) => o.name === val);
      if (found) return found.label;
    }
    return null;
  }, [options, groups, flatOptions, val]);
  const displayedLabel = displayValue ?? selectedLabel;
  const selectedOverlayStyle =
    colorLabels && displayedLabel ? overlayStyle(displayedLabel) : undefined;

  const handleSelect = (name: string) => {
    if (name.startsWith("system:") && rule?.id) {
      const resolved = systemTagToRule(name);
      if (resolved) {
        const query = schema.getQuery();
        const updated = updateRuleById(query, rule.id, {
          ...rule,
          ...resolved,
        });
        schema.dispatchQuery(updated);
        setOpen(false);
        return;
      }
    }

    onChange(name);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border px-3 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:opacity-50 lg:w-auto lg:max-w-96 lg:min-w-60",
          selectedOverlayStyle &&
            "border-(--badge-overlay)/30 bg-[color-mix(in_srgb,var(--badge-overlay)_20%,transparent)] text-(--badge-overlay) hover:bg-[color-mix(in_srgb,var(--badge-overlay)_25%,transparent)]",
          className,
        )}
        style={selectedOverlayStyle}
        aria-label={title}
      >
        <span className="truncate">{displayedLabel ?? title ?? "Select…"}</span>
        <IconChevronDown
          className={cn(
            "size-4 shrink-0",
            selectedOverlayStyle
              ? "text-(--badge-overlay)"
              : "text-muted-foreground",
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[70dvh] w-80 p-0"
        align="start"
        side="right"
        alignOffset={-4}
        sideOffset={-240}
        positionMethod="fixed"
      >
        <DrillDownCommandContent
          groups={groups}
          flatOptions={flatOptions}
          selectedValue={val as string}
          searchPlaceholder={`Search ${title?.toLowerCase() ?? ""}…`}
          onSelect={handleSelect}
        />
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
        size="icon-sm"
        className={cn(
          "text-muted-foreground hover:text-destructive shrink-0",
          className,
        )}
        title={
          disabledTranslation && disabled ? disabledTranslation.title : title
        }
        aria-label={title?.includes("group") ? "Remove group" : "Remove"}
        onClick={(e) => handleOnClick(e)}
        disabled={disabled && !disabledTranslation}
        type="button"
      >
        <IconTrash className="size-5" />
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

  // Add rule: "Add system" combobox
  return (
    <SystemFieldCombobox
      className={className}
      disabled={disabled}
      onSelect={(fieldName) =>
        handleOnClick(undefined, { inlineTag: fieldName })
      }
    />
  );
}

/** All non-tag system fields grouped for the "Add system" action. */
const systemFieldOptions: Array<OptionGroupItem> = fieldGroups
  .map((group) => ({
    label: group.label,
    inline: (group as { inline?: boolean }).inline,
    options: group.options
      .filter((o) => o.name !== "tag")
      .flatMap((o) => {
        const systemTags = SYSTEM_TAGS.filter(
          (tag) => systemTagToRule(tag)?.field === o.name,
        );

        if (systemTags.length === 0) {
          return [{ name: getFieldHydrusLabel(o.name), label: o.label }];
        }

        return systemTags.map((tag) => ({ name: tag, label: tag }));
      }),
  }))
  .filter((group) => group.options.length > 0);

function SystemFieldCombobox({
  className,
  disabled,
  onSelect,
}: {
  className?: string;
  disabled?: boolean;
  onSelect: (fieldName: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (name: string) => {
    onSelect(name);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "cursor-pointer",
          className,
        )}
      >
        <IconPlus data-icon="inline-start" className="size-5" />
        Add system
        <IconChevronDown data-icon="inline-end" className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[70dvh] w-80 p-0"
        align="start"
        positionMethod="fixed"
      >
        <DrillDownCommandContent
          groups={systemFieldOptions}
          flatOptions={null}
          searchPlaceholder="Search system fields…"
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
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
        onSystemSelect={(systemTag) => {
          const resolved = systemTagToRule(systemTag);
          if (!resolved) return;
          const query = props.schema.getQuery();
          const updated = updateRuleById(query, props.rule.id!, {
            ...props.rule,
            ...resolved,
          });
          props.schema.dispatchQuery(updated);
        }}
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
    <TextValueEditor
      type={fieldData.inputType === "number" ? "number" : "text"}
      value={value ?? ""}
      onChange={handleOnChange}
      disabled={disabled}
      title={title}
      name={`hyaway-spb-${field}`}
    />
  );
}

function TextValueEditor({
  type,
  value,
  onChange,
  disabled,
  title,
  name,
}: {
  type: "number" | "text";
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  title?: string;
  name: string;
}) {
  const [inputValue, setInputValue] = useState(value);
  const inputValueRef = useRef(value);

  useEffect(() => {
    setInputValue(value);
    inputValueRef.current = value;
  }, [value]);

  const commitValue = useCallback(
    (nextValue = inputValueRef.current) => {
      if (nextValue !== value) {
        onChange(nextValue);
      }
    },
    [onChange, value],
  );

  const handleChange = useCallback((nextValue: string) => {
    inputValueRef.current = nextValue;
    setInputValue(nextValue);
  }, []);

  return (
    <Input
      type={type}
      className="w-full lg:w-auto lg:max-w-96 lg:min-w-40"
      name={name}
      value={inputValue}
      disabled={disabled}
      title={title}
      autoComplete="off"
      onChange={(e) => handleChange(e.target.value)}
      onBlur={() => commitValue()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const nextValue = e.currentTarget.value;
          inputValueRef.current = nextValue;
          commitValue(nextValue);
          e.currentTarget.blur();
        }
      }}
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

/** Walk the query tree and replace the rule matching the given id. */
function updateRuleById(
  query: RuleGroupTypeAny,
  ruleId: string,
  newRule: RuleType,
): RuleGroupTypeAny {
  const rules = (query as { rules: Array<RuleType | RuleGroupTypeAny> }).rules;
  return {
    ...query,
    rules: rules.map((r) => {
      if ((r as RuleType).id === ruleId) return newRule;
      if ("rules" in r) return updateRuleById(r, ruleId, newRule);
      return r;
    }),
  } as RuleGroupTypeAny;
}

function TagValueEditor({
  value,
  onChange,
  onSystemSelect,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  onSystemSelect?: (systemTag: string) => void;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState(value);
  const inputValueRef = useRef(value);

  useEffect(() => {
    setInputValue(value);
    inputValueRef.current = value;
  }, [value]);

  const commitValue = useCallback(
    (nextValue = inputValueRef.current) => {
      if (nextValue !== value) {
        onChange(nextValue);
      }
    },
    [onChange, value],
  );

  const handleChange = useCallback((nextValue: string) => {
    inputValueRef.current = nextValue;
    setInputValue(nextValue);
  }, []);

  const handleCommit = useCallback(
    (nextValue: string) => {
      inputValueRef.current = nextValue;
      setInputValue(nextValue);
      commitValue(nextValue);
    },
    [commitValue],
  );

  const handleSelect = useCallback(
    (tag: string) => {
      const selected = inputValueRef.current.trimStart().startsWith("-")
        ? `-${tag}`
        : tag;
      setInputValue(selected);
      handleCommit(selected);
    },
    [handleCommit],
  );

  const handleToggleNegation = useCallback(() => {
    const currentValue = inputValueRef.current;
    const toggled = currentValue.trimStart().startsWith("-")
      ? currentValue.replace(/^-/, "")
      : `-${currentValue}`;

    setInputValue(toggled);
    handleCommit(toggled);
  }, [handleCommit]);

  const isNegated = inputValue.trimStart().startsWith("-");

  return (
    <>
      <TagAutocompleteInput
        className="relative w-full lg:w-auto lg:max-w-lg lg:min-w-48 lg:flex-1"
        value={inputValue}
        onChange={handleChange}
        onSelect={(tag) => {
          if (onSystemSelect && tag.startsWith("system:")) {
            onSystemSelect(tag);
          } else {
            handleSelect(tag);
          }
        }}
        onSubmit={(tag) => handleCommit(tag)}
        onBlur={(tag) => handleCommit(tag)}
        disabled={disabled}
        placeholder="e.g. cat or system:…"
        name="hyaway-spb-tag"
        colorizeInput
        staticSuggestions={SYSTEM_TAGS}
        submitEmptyOnBlur
        submitEmptyOnEnter
      />
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        onClick={handleToggleNegation}
        disabled={disabled}
        type="button"
        title={isNegated ? "Include tag" : "Exclude tag"}
        aria-label={isNegated ? "Include tag" : "Exclude tag"}
      >
        <IconPlusMinus className="size-5" />
      </Button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Combinator selector
// ---------------------------------------------------------------------------

/** Combinator label with separator lines below lg breakpoint. */
export function CombinatorSeparator({ text }: { text: string }) {
  return (
    <div className="flex w-full items-center lg:w-auto lg:px-1">
      <div className="bg-border h-px flex-1 lg:hidden" />
      <span className="text-muted-foreground px-3 text-sm font-medium lg:px-0">
        {text}
      </span>
      <div className="bg-border h-px flex-1 lg:hidden" />
    </div>
  );
}

export function QBCombinatorSelect(props: VersatileSelectorProps) {
  const { level } = props;
  return <CombinatorSeparator text={level === 0 ? "and" : "or"} />;
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
  betweenRules: "my-2 md:my-1 lg:self-start",
  dragHandle: "hidden",
  notToggle: "hidden",
  lock: "hidden",
  cloneGroup: "hidden",
  cloneRule: "hidden",
  shiftActions: "hidden",
  valueSource: "hidden",
};
