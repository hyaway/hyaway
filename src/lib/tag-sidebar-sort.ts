// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { compareTags } from "@/lib/tag-utils";

export interface TagItem {
  tag: string;
  count: number;
  namespace: string;
}

export type TagSortMode = "count" | "namespace" | "alpha";

/** Sort tag items by the given mode. Pure — returns a new array. */
export function sortTagItems(
  items: ReadonlyArray<TagItem>,
  mode: TagSortMode,
): Array<TagItem> {
  const result = [...items];
  if (mode === "namespace") {
    // Group by namespace (namespaced first), then count desc, then name.
    result.sort((a, b) => {
      if (a.namespace !== b.namespace) return compareTags(a, b);
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.localeCompare(b.tag);
    });
  } else if (mode === "alpha") {
    // Flat alphabetical by the full displayed tag (namespace included), so
    // namespaced and unnamespaced tags interleave A-Z by what's shown.
    result.sort((a, b) => {
      const aFull = a.namespace ? `${a.namespace}:${a.tag}` : a.tag;
      const bFull = b.namespace ? `${b.namespace}:${b.tag}` : b.tag;
      return aFull.localeCompare(bFull);
    });
  } else {
    // count: count desc, then namespaced-first/name.
    result.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return compareTags(a, b);
    });
  }
  return result;
}
