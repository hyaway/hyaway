// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { SwipeBindings } from "./review-settings-store";

/** A named, saved review setup. */
export interface SavedReviewConfig {
  id: string;
  name: string;
  bindings: SwipeBindings;
  tagServiceKey: string | null;
}

/** The mutable part a config captures (the live review setup). */
export type ReviewConfigSnapshot = Pick<
  SavedReviewConfig,
  "bindings" | "tagServiceKey"
>;

/**
 * Deep-equal two config snapshots (ignores id/name). Bindings key order is
 * stable (always the four directions in the same order), so a JSON compare is
 * a reliable structural equality for the dirty check.
 */
export function configsEqual(
  a: ReviewConfigSnapshot,
  b: ReviewConfigSnapshot,
): boolean {
  return (
    a.tagServiceKey === b.tagServiceKey &&
    JSON.stringify(a.bindings) === JSON.stringify(b.bindings)
  );
}

/**
 * Return `desired` if it isn't already in `existing`, else append the smallest
 * free ` 2`, ` 3`, … suffix. Blank input falls back to "Config".
 */
export function uniqueConfigName(
  desired: string,
  existing: ReadonlyArray<string>,
): string {
  const taken = new Set(existing);
  const base = desired.trim() || "Config";
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

/**
 * Stable, unique id for a saved config. Uses the same scheme as the rest of
 * the app (see `randomHash` in `lib/search-entry-utils`) rather than
 * `crypto.randomUUID`, which is only defined in secure contexts and throws
 * (aborting the save) when the app is served over plain HTTP.
 */
export function makeConfigId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Add a new config from a snapshot (name uniquified against all existing). */
export function addConfigEntry(
  configs: Record<string, SavedReviewConfig>,
  id: string,
  name: string,
  snapshot: ReviewConfigSnapshot,
): Record<string, SavedReviewConfig> {
  const uniqueName = uniqueConfigName(
    name,
    Object.values(configs).map((c) => c.name),
  );
  return {
    ...configs,
    [id]: {
      id,
      name: uniqueName,
      bindings: snapshot.bindings,
      tagServiceKey: snapshot.tagServiceKey,
    },
  };
}

/** Overwrite an existing config's snapshot, keeping its id + name. No-op if absent. */
export function overwriteConfigEntry(
  configs: Record<string, SavedReviewConfig>,
  id: string,
  snapshot: ReviewConfigSnapshot,
): Record<string, SavedReviewConfig> {
  if (!(id in configs)) return configs;
  const existing = configs[id];
  return {
    ...configs,
    [id]: {
      ...existing,
      bindings: snapshot.bindings,
      tagServiceKey: snapshot.tagServiceKey,
    },
  };
}

/** Rename a config (name uniquified against the OTHER configs; self-rename keeps the name). */
export function renameConfigEntry(
  configs: Record<string, SavedReviewConfig>,
  id: string,
  name: string,
): Record<string, SavedReviewConfig> {
  if (!(id in configs)) return configs;
  const existing = configs[id];
  const otherNames = Object.values(configs)
    .filter((c) => c.id !== id)
    .map((c) => c.name);
  return {
    ...configs,
    [id]: { ...existing, name: uniqueConfigName(name, otherNames) },
  };
}

/** Remove a config. No-op if absent. */
export function removeConfigEntry(
  configs: Record<string, SavedReviewConfig>,
  id: string,
): Record<string, SavedReviewConfig> {
  if (!(id in configs)) return configs;
  const next = { ...configs };
  delete next[id];
  return next;
}

/** Saved configs as a name-sorted array. */
export function sortedConfigs(
  configs: Record<string, SavedReviewConfig>,
): Array<SavedReviewConfig> {
  return Object.values(configs).sort((a, b) => a.name.localeCompare(b.name));
}
