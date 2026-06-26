// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { getSortColorHex, getSortLabel } from "./query-builder-fields";
import type { SortConfig } from "@/stores/search-defaults";
import {
  formatNamespaceSortValue,
  isNamespaceSortConfig,
} from "@/stores/search-defaults";

export function getSearchSortLabel(sort: SortConfig): string {
  if (isNamespaceSortConfig(sort)) {
    const orderLabel = sort.sortAsc ? "a-z" : "z-a";
    return `Sort by namespaces: ${formatNamespaceSortValue(sort.namespaces)} (${orderLabel})`;
  }

  return getSortLabel(sort.sortType, sort.sortAsc);
}

export function getSearchSortColorHex(sort: SortConfig): string | undefined {
  if (isNamespaceSortConfig(sort)) return undefined;

  return getSortColorHex(sort.sortType, sort.sortAsc);
}
