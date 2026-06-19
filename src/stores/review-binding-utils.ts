// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type {
  SecondarySwipeAction,
  TagSwipeAction,
} from "./review-settings-store";

/** Which kind of tag secondary action to read/write. */
export type TagActionKind = "addTag" | "removeTag";

/**
 * Extract the tag secondary actions of the given kind (defaults to "addTag"),
 * without the actionType discriminant.
 */
export function getTagActions(
  secondaryActions?: Array<SecondarySwipeAction>,
  kind: TagActionKind = "addTag",
): Array<TagSwipeAction> {
  if (!secondaryActions) return [];
  return secondaryActions
    .filter(
      (a): a is SecondarySwipeAction & { actionType: TagActionKind } =>
        a.actionType === kind,
    )
    .map(({ actionType: _actionType, ...rest }) => rest);
}

/**
 * Replace the tag secondary actions of the given kind (defaults to "addTag")
 * with `tags`, preserving every other action (the other tag kind + ratings).
 * Returns undefined when nothing remains.
 */
export function withTagActions(
  secondaryActions: Array<SecondarySwipeAction> | undefined,
  tags: Array<string>,
  kind: TagActionKind = "addTag",
): Array<SecondarySwipeAction> | undefined {
  const otherActions =
    secondaryActions?.filter((a) => a.actionType !== kind) ?? [];
  const tagActions: Array<SecondarySwipeAction> = tags.map((tag) => ({
    actionType: kind,
    tag,
  }));
  const next = [...otherActions, ...tagActions];
  return next.length > 0 ? next : undefined;
}
