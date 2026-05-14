// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconTagStarred } from "@tabler/icons-react";
import { defaultFilter } from "cmdk";
import type { CSSProperties } from "react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui-primitives/command";
import { Input } from "@/components/ui-primitives/input";
import {
  useFavouriteTagsLookup,
  useFavouriteTagsQuery,
  useSearchTagsQuery,
} from "@/integrations/hydrus-api/queries/tags";
import { useNamespaceColor } from "@/integrations/hydrus-api/queries/options";
import { parseTag } from "@/lib/tag-utils";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// TagAutocompleteInput
// ---------------------------------------------------------------------------

export function TagAutocompleteInput({
  value = "",
  onChange,
  onSelect,
  onSubmit,
  onBlur,
  placeholder = "Search tags…",
  name,
  disabled,
  className,
  inputClassName,
  colorizeInput,
  staticSuggestions,
  clearOnSelect,
  submitEmptyOnBlur,
  submitEmptyOnEnter,
}: {
  /** Controlled value (optional — uncontrolled by default). */
  value?: string;
  /** Called on every keystroke with the raw input value. */
  onChange?: (value: string) => void;
  /** Called when the user selects a suggestion from the dropdown. */
  onSelect?: (tag: string) => void;
  /** Called when the user presses Enter with typed text (no dropdown selection). */
  onSubmit?: (tag: string) => void;
  /** Called when the input loses focus with non-empty text. */
  onBlur?: (tag: string) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  /** Additional classes for the input element. */
  inputClassName?: string;
  /** Apply namespace color to the input text. */
  colorizeInput?: boolean;
  /** Static tags filtered locally and shown above API results when matching. */
  staticSuggestions?: Array<string>;
  /** Clear the input after a suggestion is selected. */
  clearOnSelect?: boolean;
  /** Call onBlur with an empty string when the input is cleared. */
  submitEmptyOnBlur?: boolean;
  /** Call onSubmit with an empty string when Enter is pressed in a cleared input. */
  submitEmptyOnEnter?: boolean;
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
  const { data: favouriteTags } = useFavouriteTagsQuery();
  const suggestions = data?.tags.slice(0, 50) ?? [];
  const hasSufficientInput = inputValue.trim().replace(/^-+/, "").length >= 3;
  const searchText = inputValue.trim().replace(/^-+/, "").toLowerCase();
  const filteredFavourites = searchText
    ? [...(favouriteTags ?? [])].filter((tag) =>
        tag.toLowerCase().includes(searchText),
      )
    : [...(favouriteTags ?? [])];
  const filteredStatic = useMemo(() => {
    const normalized = searchText.replace(/\s+/g, "");
    if (!normalized.startsWith("system:") || !staticSuggestions?.length)
      return [];
    if (normalized === "system:") return staticSuggestions;
    return staticSuggestions
      .map((tag) => ({ tag, score: defaultFilter(tag, normalized) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.tag);
  }, [searchText, staticSuggestions]);
  const showFavourites =
    open && !hasSufficientInput && filteredFavourites.length > 0;
  const showDropdown =
    (open && hasSufficientInput && suggestions.length > 0) ||
    showFavourites ||
    (open && filteredStatic.length > 0);

  const favourites = useFavouriteTagsLookup();
  const normalizedInputValue = inputValue.trim().replace(/^-+/, "");
  const isFavouriteInput = normalizedInputValue
    ? favourites.has(normalizedInputValue)
    : false;
  const inputColor = useNamespaceColor(parseTag(inputValue).namespace);
  const colorizedInputStyle: CSSProperties = { "--badge-overlay": inputColor };

  const handleSelect = useCallback(
    (tag: string) => {
      if (clearOnSelect) {
        setInputValue("");
        onChange?.("");
      } else {
        setInputValue(tag);
        onChange?.(tag);
      }
      onSelect?.(tag);
      setOpen(false);
    },
    [clearOnSelect, onChange, onSelect],
  );

  return (
    <div className={className ?? "relative w-full"}>
      <Input
        className={cn(
          "w-full",
          colorizeInput &&
            "border-(--badge-overlay)/30 bg-[color-mix(in_srgb,var(--badge-overlay)_20%,transparent)] text-(--badge-overlay) placeholder:text-(--badge-overlay)/60 hover:bg-[color-mix(in_srgb,var(--badge-overlay)_25%,transparent)]",
          isFavouriteInput && "pe-10",
          inputClassName,
        )}
        style={colorizeInput ? colorizedInputStyle : undefined}
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
          setOpen(false);
          if (onBlur) {
            const trimmed = inputValue.trim();
            if (trimmed || submitEmptyOnBlur) {
              onBlur(trimmed);
              if (clearOnSelect) {
                setInputValue("");
                onChange?.("");
              }
            }
          }
        }}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            onSubmit &&
            (inputValue.trim() || submitEmptyOnEnter)
          ) {
            e.preventDefault();
            const trimmed = inputValue.trim();
            onSubmit(trimmed);
            if (clearOnSelect) {
              setInputValue("");
              onChange?.("");
            }
            setOpen(false);
          }
        }}
        name={name}
        autoComplete="off"
      />
      {isFavouriteInput && (
        <IconTagStarred
          className={cn(
            "pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2",
            colorizeInput ? "text-(--badge-overlay)" : "text-muted-foreground",
          )}
          style={colorizeInput ? colorizedInputStyle : undefined}
          aria-hidden
        />
      )}
      {showDropdown && (
        <div
          className="bg-popover border-border ring-foreground/5 absolute top-full left-0 z-50 mt-1 w-full min-w-64 overflow-hidden rounded-lg border shadow-md ring-1"
          onPointerDown={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {hasSufficientInput ? (
                <>
                  {filteredStatic.map((tag) => (
                    <TagSuggestionItem
                      key={tag}
                      value={tag}
                      prefix={isNegative ? "-" : undefined}
                      showFavourite={false}
                      onSelect={() => handleSelect(tag)}
                    />
                  ))}
                  {suggestions.map((tag) => (
                    <TagSuggestionItem
                      key={tag.value}
                      value={tag.value}
                      prefix={isNegative ? "-" : undefined}
                      count={tag.count}
                      onSelect={() => handleSelect(tag.value)}
                    />
                  ))}
                </>
              ) : (
                <>
                  {filteredStatic.map((tag) => (
                    <TagSuggestionItem
                      key={tag}
                      value={tag}
                      prefix={isNegative ? "-" : undefined}
                      showFavourite={false}
                      onSelect={() => handleSelect(tag)}
                    />
                  ))}
                  {filteredFavourites.length > 0 && (
                    <CommandGroup
                      heading={
                        <span className="inline-flex items-center gap-1 text-sm">
                          <IconTagStarred className="size-5" />
                          Favourite tags
                        </span>
                      }
                    >
                      {filteredFavourites.map((tag) => (
                        <TagSuggestionItem
                          key={tag}
                          value={tag}
                          prefix={isNegative ? "-" : undefined}
                          showFavourite={false}
                          onSelect={() => handleSelect(tag)}
                        />
                      ))}
                    </CommandGroup>
                  )}
                </>
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
  showFavourite = true,
  onSelect,
}: {
  value: string;
  prefix?: string;
  count?: number;
  showFavourite?: boolean;
  onSelect: () => void;
}) {
  const favourites = useFavouriteTagsLookup();
  const { namespace } = parseTag(value);
  const color = useNamespaceColor(namespace);
  const style: CSSProperties = { color };
  const isFavourite = showFavourite && favourites.has(value);

  return (
    <CommandItem value={value} onSelect={onSelect}>
      <span className="min-w-0 flex-1 truncate" style={style}>
        {prefix}
        {value}
      </span>
      {isFavourite && (
        <IconTagStarred className="size-5 shrink-0" style={style} />
      )}
      {count != null && (
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {count.toLocaleString()}
        </span>
      )}
    </CommandItem>
  );
}
