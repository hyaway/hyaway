// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

export function getNextUniqueName(
  base: string,
  existingNames: Iterable<string>,
) {
  let maxSuffix = -1;

  for (const name of existingNames) {
    if (name === base) {
      maxSuffix = Math.max(maxSuffix, 0);
      continue;
    }

    if (!name.startsWith(`${base} (`) || !name.endsWith(")")) continue;

    const suffix = name.slice(base.length + 2, -1);
    if (!/^\d+$/.test(suffix)) continue;

    maxSuffix = Math.max(maxSuffix, Number(suffix));
  }

  return maxSuffix === -1 ? base : `${base} (${maxSuffix + 1})`;
}
