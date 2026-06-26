// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Lightweight fingerprint for an array of file IDs.
 * Avoids putting the full (potentially 100k+) array into TanStack Query keys,
 * while still incorporating every ID in order.
 */
export function fileIdsFingerprint(
  ids: Array<number>,
): [length: number, hash: number] {
  let hash = 2166136261;

  for (const id of ids) {
    hash ^= id >>> 0;
    hash = Math.imul(hash, 16777619);
    hash ^= Math.floor(id / 0x100000000) >>> 0;
    hash = Math.imul(hash, 16777619);
  }

  return [ids.length, hash >>> 0];
}
