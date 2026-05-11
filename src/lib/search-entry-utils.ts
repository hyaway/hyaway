// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { QueryClient } from "@tanstack/react-query";

export const committedSearchQueryKey = (entryKey: string) =>
  ["searchFiles", "searchPage", entryKey] as const;

function randomHash(): string {
  return Math.random().toString(36).slice(2, 10);
}

function sanitize(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/** Generate a unique search entry ID, optionally prefixed with a readable name. */
export function generateSearchId(name?: string): string {
  const base = name ? sanitize(name) : "";
  return base ? `${base}_${randomHash()}` : randomHash();
}

/**
 * Copy all React Query cache entries from one search key to another.
 * Optionally removes the source entries (for rename/move).
 */
export function copySearchCache(
  queryClient: QueryClient,
  fromId: string,
  toId: string,
  removeSource = false,
) {
  const fromBaseKey = committedSearchQueryKey(fromId);
  const toBaseKey = committedSearchQueryKey(toId);

  for (const [key, data] of queryClient.getQueriesData({
    queryKey: fromBaseKey,
  })) {
    const newKey = [...toBaseKey, ...key.slice(fromBaseKey.length)];
    queryClient.setQueryData(newKey, data);
    if (removeSource) {
      queryClient.removeQueries({ queryKey: key });
    }
  }
}
