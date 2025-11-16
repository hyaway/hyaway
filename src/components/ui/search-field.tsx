"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  Button,
  SearchField as SearchFieldPrimitive,
} from "react-aria-components";
import { twJoin } from "tailwind-merge";
import { Input, InputGroup } from "./input";
import type { InputProps, SearchFieldProps } from "react-aria-components";
import { fieldStyles } from "@/components/ui/field";
import { cx } from "@/lib/primitive";

export function SearchField({ className, ...props }: SearchFieldProps) {
  return (
    <SearchFieldPrimitive
      {...props}
      aria-label={props["aria-label"] ?? "Search"}
      className={cx(
        fieldStyles({ className: "group/search-field" }),
        className,
      )}
    />
  );
}

export function SearchInput(props: InputProps) {
  return (
    <InputGroup className="[--input-gutter-end:--spacing(8)]">
      <MagnifyingGlassIcon />
      <Input {...props} />
      <Button
        className={twJoin(
          "touch-target pressed:text-fg text-muted-fg hover:text-fg grid place-content-center group-empty/search-field:invisible",
          "px-3 py-2 sm:px-2.5 sm:py-1.5 sm:text-sm/5",
        )}
      >
        <XMarkIcon className="size-5 sm:size-4" />
      </Button>
    </InputGroup>
  );
}
