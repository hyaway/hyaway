// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconX } from "@tabler/icons-react";
import { useRef } from "react";
import { usePagesSearch } from "./pages-search-context";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui-primitives/input-group";
import { cn } from "@/lib/utils";

interface PagesSearchInputProps {
  variant?: "page" | "sidebar";
}

export function PagesSearchInput({ variant = "page" }: PagesSearchInputProps) {
  const { query, setQuery } = usePagesSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = query.length > 0;

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <InputGroup
      className={cn(variant === "sidebar" && "bg-background h-10 shadow-none")}
    >
      <InputGroupInput
        ref={inputRef}
        placeholder="Search pages"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {hasValue ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            onClick={handleClear}
            aria-label="Clear pages search"
          >
            <IconX className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
