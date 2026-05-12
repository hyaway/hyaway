// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui-primitives/command";
import { Input } from "@/components/ui-primitives/input";
import {
  useFavouriteTagsQuery,
  useSearchTagsQuery,
} from "@/integrations/hydrus-api/queries/tags";
import { useNamespaceColors } from "@/integrations/hydrus-api/queries/options";
import { parseTag } from "@/lib/tag-utils";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// TagAutocompleteInput
// ---------------------------------------------------------------------------

export function TagAutocompleteInput({
  value = "",
  onChange,
  onSelect,
  placeholder = "Search tags…",
  name,
  disabled,
  className,
  inputClassName,
  colorizeInput,
}: {
  /** Controlled value (optional — uncontrolled by default). */
  value?: string;
  /** Called on every keystroke with the raw input value. */
  onChange?: (value: string) => void;
  /** Called when the user selects a suggestion from the dropdown. */
  onSelect?: (tag: string) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  /** Additional classes for the input element. */
  inputClassName?: string;
  /** Apply namespace color to the input text. */
  colorizeInput?: boolean;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedInput, setDebouncedInput] = useState(value);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync controlled value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedInput(inputValue);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  const isNegative = debouncedInput.startsWith("-");
  const { data } = useSearchTagsQuery(
    debouncedInput.replace(/^-+/, "").replace(/:$/, ""),
  );
  const { data: favouritesData } = useFavouriteTagsQuery();
  const suggestions = data?.tags.slice(0, 50) ?? [];
  const hasSufficientInput = inputValue.trim().replace(/^-+/, "").length >= 3;
  const favouriteTags = favouritesData?.favourite_tags ?? [];
  const showFavourites =
    open && !hasSufficientInput && favouriteTags.length > 0;
  const showDropdown =
    (open && hasSufficientInput && suggestions.length > 0) || showFavourites;

  const namespaceColors = useNamespaceColors();
  const inputColor = colorizeInput
    ? (namespaceColors[parseTag(inputValue).namespace] ??
      namespaceColors["null"])
    : undefined;

  const handleSelect = useCallback(
    (tag: string) => {
      setInputValue(tag);
      onChange?.(tag);
      onSelect?.(tag);
      setOpen(false);
    },
    [onChange, onSelect],
  );

  return (
    <div className={className ?? "relative w-full"}>
      <Input
        className={cn("w-full", inputClassName)}
        style={inputColor ? { color: inputColor } : undefined}
        value={inputValue}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange?.(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
        name={name}
        autoComplete="off"
      />
      {showDropdown && (
        <div className="bg-popover border-border ring-foreground/5 absolute top-full left-0 z-50 mt-1 w-full min-w-64 overflow-hidden rounded-lg border shadow-md ring-1">
          <Command shouldFilter={false}>
            <CommandList>
              {hasSufficientInput ? (
                suggestions.map((tag) => (
                  <TagSuggestionItem
                    key={tag.value}
                    value={tag.value}
                    prefix={isNegative ? "-" : undefined}
                    count={tag.count}
                    onSelect={() => handleSelect(tag.value)}
                  />
                ))
              ) : (
                <CommandGroup heading="Favourite tags">
                  {favouriteTags.map((tag) => (
                    <TagSuggestionItem
                      key={tag}
                      value={tag}
                      prefix={isNegative ? "-" : undefined}
                      onSelect={() => handleSelect(tag)}
                    />
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TagSuggestionItem
// ---------------------------------------------------------------------------

export function TagSuggestionItem({
  value,
  prefix,
  count,
  onSelect,
}: {
  value: string;
  prefix?: string;
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
        {prefix}
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
