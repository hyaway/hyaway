// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

export function isIgnorableTagRuleValue(value: unknown): boolean {
  if (typeof value !== "string") return false;

  const tag = value.trim();
  return tag === "" || tag === "system:" || tag === "system:*";
}
