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
  useFavouriteTagsQuery,
  useIsFavouriteTag,
  useSearchTagsQuery,
} from "@/integrations/hydrus-api/queries/tags";
import { useTagColor } from "@/integrations/hydrus-api/queries/options";
import { cn } from "@/lib/utils";
import { SYSTEM_TAG_SUGGESTIONS } from "@/routes/_auth/(search)/-lib/query-builder-fields";

// ---------------------------------------------------------------------------
// TagAutocompleteInput
// ---------------------------------------------------------------------------

const MAX_TAG_SUGGESTIONS = 20;

export function TagAutocompleteInput({
  value = "",
  onChange,
  onSelect,
  onSubmit,
  onBlur,
  placeholder = "Add tag or system predicate",
  name,
  disabled,
  className,
  inputClassName,
  colorizeInput,
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
  const suggestions = data?.tags.slice(0, MAX_TAG_SUGGESTIONS) ?? [];
  const hasSufficientInput = inputValue.trim().replace(/^-+/, "").length >= 3;
  const searchText = inputValue.trim().replace(/^-+/, "").toLowerCase();
  const filteredFavourites = searchText
    ? [...(favouriteTags ?? [])].filter((tag) =>
        tag.toLowerCase().includes(searchText),
      )
    : [...(favouriteTags ?? [])];
  const filteredStatic = useMemo(() => {
    if (!searchText || SYSTEM_TAG_SUGGESTIONS.length === 0) return [];
    if (!searchText.startsWith("system:") && searchText.length < 2) {
      return [];
    }

    const isSystemSearch = searchText.startsWith("system:");

    if (searchText === "system:") return SYSTEM_TAG_SUGGESTIONS;

    const matches = SYSTEM_TAG_SUGGESTIONS.map((suggestion) => ({
      suggestion,
      score: defaultFilter(suggestion.value, searchText, suggestion.keywords),
    }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.suggestion);

    return isSystemSearch ? matches : matches.slice(0, 2);
  }, [searchText]);
  const showFavourites =
    open && !hasSufficientInput && filteredFavourites.length > 0;
  const showDropdown =
    (open && hasSufficientInput && suggestions.length > 0) ||
    showFavourites ||
    (open && filteredStatic.length > 0);

  const isFavouriteInput = useIsFavouriteTag(inputValue);
  const inputColor = useTagColor(inputValue);
  const hasColorizedInput = colorizeInput && inputValue.trim().length > 0;
  const colorizedInputStyle: CSSProperties | undefined = hasColorizedInput
    ? { "--badge-overlay": inputColor }
    : undefined;

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
          hasColorizedInput &&
            "border-(--badge-overlay)/30 bg-[color-mix(in_srgb,var(--badge-overlay)_20%,transparent)] text-(--badge-overlay) placeholder:text-(--badge-overlay)/60 hover:bg-[color-mix(in_srgb,var(--badge-overlay)_25%,transparent)]",
          isFavouriteInput && "pe-10",
          inputClassName,
        )}
        style={colorizedInputStyle}
        value={inputValue}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange?.(e.target.value);
          setOpen(true);
        }}
        onPointerDown={() => setOpen(true)}
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
            hasColorizedInput
              ? "text-(--badge-overlay)"
              : "text-muted-foreground",
          )}
          style={colorizedInputStyle}
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
                  {filteredStatic.map((suggestion) => (
                    <TagSuggestionItem
                      key={suggestion.value}
                      value={suggestion.value}
                      prefix={isNegative ? "-" : undefined}
                      showFavouriteIcon={false}
                      onSelect={() => handleSelect(suggestion.value)}
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
                  {filteredStatic.map((suggestion) => (
                    <TagSuggestionItem
                      key={suggestion.value}
                      value={suggestion.value}
                      prefix={isNegative ? "-" : undefined}
                      showFavouriteIcon={false}
                      onSelect={() => handleSelect(suggestion.value)}
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
                          showFavouriteIcon={false}
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
  showFavouriteIcon = true,
  onSelect,
}: {
  value: string;
  prefix?: string;
  count?: number;
  showFavouriteIcon?: boolean;
  onSelect: () => void;
}) {
  const color = useTagColor(value);
  const style: CSSProperties = { color };
  const isFavouriteTag = useIsFavouriteTag(value);
  const showStar = showFavouriteIcon && isFavouriteTag;

  return (
    <CommandItem
      value={value}
      onSelect={onSelect}
      className="[&>svg:last-child]:hidden"
    >
      <span className="min-w-0 flex-1 truncate" style={style}>
        {prefix}
        {value}
      </span>
      <span className="ms-auto inline-flex shrink-0 items-center gap-2">
        {showStar && <IconTagStarred className="size-5" style={style} />}
        {count != null && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {count.toLocaleString()}
          </span>
        )}
      </span>
    </CommandItem>
  );
}
