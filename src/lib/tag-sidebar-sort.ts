// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { TagItem } from "@/lib/tag-sidebar-types";
import { compareTags } from "@/lib/tag-utils";

export type TagSortMode = "count" | "namespace" | "api";

function assertNever(value: never): never {
  throw new Error(`Unhandled tag sort mode: ${String(value)}`);
}

/** Sort tag items by the given mode. Pure — returns a new array. */
export function sortTagItems(
  items: ReadonlyArray<TagItem>,
  mode: TagSortMode,
): Array<TagItem> {
  const result = [...items];

  switch (mode) {
    case "api":
      return result;
    case "namespace":
      result.sort((a, b) => {
        if (a.namespace !== b.namespace) return compareTags(a, b);
        if (b.count !== a.count) return b.count - a.count;
        return a.tag.localeCompare(b.tag);
      });
      return result;
    case "count":
      result.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return compareTags(a, b);
      });
      return result;
    default:
      mode satisfies never;
      return assertNever(mode);
  }
}
