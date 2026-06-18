// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type {
  SecondarySwipeAction,
  TagSwipeAction,
} from "./review-settings-store";

/** Extract the addTag secondary actions (without the actionType tag). */
export function getTagActions(
  secondaryActions?: Array<SecondarySwipeAction>,
): Array<TagSwipeAction> {
  if (!secondaryActions) return [];
  return secondaryActions
    .filter(
      (a): a is SecondarySwipeAction & { actionType: "addTag" } =>
        a.actionType === "addTag",
    )
    .map(({ actionType: _actionType, ...rest }) => rest);
}

/**
 * Replace the addTag secondary actions on a list with `tags`, preserving any
 * non-tag (e.g. rating) actions. Returns undefined when nothing remains.
 */
export function withTagActions(
  secondaryActions: Array<SecondarySwipeAction> | undefined,
  tags: Array<string>,
): Array<SecondarySwipeAction> | undefined {
  const otherActions =
    secondaryActions?.filter((a) => a.actionType !== "addTag") ?? [];
  const tagActions: Array<SecondarySwipeAction> = tags.map((tag) => ({
    actionType: "addTag",
    tag,
  }));
  const next = [...otherActions, ...tagActions];
  return next.length > 0 ? next : undefined;
}
