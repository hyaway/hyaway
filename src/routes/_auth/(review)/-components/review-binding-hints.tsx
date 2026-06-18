// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import type {
  ReviewSwipeBinding,
  SwipeBindings,
  SwipeDirection,
} from "@/stores/review-settings-store";
import { getTagActions } from "@/stores/review-binding-utils";

/** Max tags listed per direction before collapsing to a count. */
export const MAX_HINT_TAGS = 5;

export interface DirectionHint {
  /** Action label to show, or null to omit (skip with tags). */
  actionLabel: string | null;
  /** Tags to list one per line (empty when overflowing). */
  tags: Array<string>;
  /** Total tag count when it exceeds the max; otherwise null. */
  overflowCount: number | null;
}

/**
 * Build the tag hint for one swipe direction, or null when it has no tags.
 *
 * - Skip + tags drops the (meaningless) "Skip" label and shows just the tags.
 * - Any other action shows the action label plus its tags.
 * - More than `maxTags` tags collapse to a count instead of a per-line list.
 */
export function buildDirectionHint(
  binding: ReviewSwipeBinding,
  maxTags = MAX_HINT_TAGS,
): DirectionHint | null {
  const tags = getTagActions(binding.secondaryActions).map((a) => a.tag);
  if (tags.length === 0) return null;

  const actionLabel =
    binding.fileAction === "skip"
      ? null
      : binding.fileAction.charAt(0).toUpperCase() +
        binding.fileAction.slice(1);

  if (tags.length > maxTags) {
    return { actionLabel, tags: [], overflowCount: tags.length };
  }
  return { actionLabel, tags, overflowCount: null };
}

const DIRECTION_ARROWS: Record<SwipeDirection, Icon> = {
  left: IconArrowLeft,
  right: IconArrowRight,
  up: IconArrowUp,
  down: IconArrowDown,
};

/** Order matches the footer's direction buttons (left, down, up, right). */
const HINT_DIRECTIONS: Array<SwipeDirection> = ["left", "down", "up", "right"];

interface ResolvedHint {
  direction: SwipeDirection;
  hint: DirectionHint;
}

/**
 * Desktop-only hint strip rendered just above the review footer.
 *
 * For each swipe direction that adds tags, shows the direction arrow, the
 * action (unless it's a tag-only skip), and the tags one per line. Hidden on
 * touch/narrow layouts, where dragging a card already surfaces the same
 * descriptor as an overlay.
 */
export function ReviewBindingHints({ bindings }: { bindings: SwipeBindings }) {
  const hints: Array<ResolvedHint> = [];
  for (const direction of HINT_DIRECTIONS) {
    const hint = buildDirectionHint(bindings[direction]);
    if (hint) hints.push({ direction, hint });
  }

  if (hints.length === 0) return null;

  return (
    <div className="hidden items-start justify-center gap-x-8 gap-y-2 px-4 pb-1 text-xs md:flex">
      {hints.map(({ direction, hint }) => {
        const Arrow = DIRECTION_ARROWS[direction];
        return (
          <div
            key={direction}
            className="flex min-w-0 flex-col items-center gap-0.5 text-center"
          >
            <span
              className="text-muted-foreground flex items-center gap-1 font-medium"
              aria-label={`Swipe ${direction}${
                hint.actionLabel ? ` — ${hint.actionLabel}` : ""
              }`}
            >
              <Arrow className="size-3.5 shrink-0" aria-hidden />
              {hint.actionLabel}
            </span>
            {hint.overflowCount != null ? (
              <span className="text-foreground/80">
                +{hint.overflowCount} tags
              </span>
            ) : (
              hint.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-foreground/80 max-w-[20ch] truncate"
                >
                  {tag}
                </span>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
