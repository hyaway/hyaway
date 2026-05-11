// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { QueryClient } from "@tanstack/react-query";

export const committedSearchQueryKey = (entryKey: string) =>
  ["searchFiles", "searchPage", entryKey] as const;

function randomHash(): string {
  return Math.random().toString(36).slice(2, 6);
}

/** Generate a unique search page ID (e.g. "2026-05-10_a3f7"). */
export function generateSearchId(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  const date = local.toISOString().slice(0, 10);
  return `${date}_${randomHash()}`;
}

/**
 * Generate a clone ID from an existing search ID.
 * Strips a trailing `_xxxx` hash (if present) and appends a fresh one.
 */
export function generateCloneId(sourceId: string): string {
  const base = sourceId.replace(/_[a-z0-9]{4}$/, "");
  return `${base}_${randomHash()}`;
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
