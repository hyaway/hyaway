// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useNavigate, useSearch } from "@tanstack/react-router";
import { IconX } from "@tabler/icons-react";
import { useRef } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui-primitives/input-group";
import { cn } from "@/lib/utils";

const PAGES_INDEX_PATH = "/pages";
const PAGES_ROUTE_FULL_PATH = "/_auth/(remote-pages)/pages/";

interface PagesSearchInputProps {
  variant?: "page" | "sidebar";
}

export function PagesSearchInput({ variant = "page" }: PagesSearchInputProps) {
  const navigate = useNavigate();
  const { q } = useSearch({ from: PAGES_ROUTE_FULL_PATH });
  const inputRef = useRef<HTMLInputElement>(null);
  const value = q ?? "";
  const hasValue = value.length > 0;

  const handleValueChange = (nextValue: string) => {
    void navigate({
      to: PAGES_INDEX_PATH,
      search: (current) => ({
        ...current,
        q: nextValue ? nextValue : undefined,
      }),
      replace: true,
    });
  };

  const handleClear = () => {
    handleValueChange("");
    inputRef.current?.focus();
  };

  return (
    <InputGroup
      className={cn(variant === "sidebar" && "bg-background h-10 shadow-none")}
    >
      <InputGroupInput
        ref={inputRef}
        placeholder="Search pages"
        value={value}
        onChange={(event) => handleValueChange(event.target.value)}
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
