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
import { cn } from "@/lib/utils";

/** Max tags listed per direction before collapsing to a count. */
export const MAX_HINT_TAGS = 5;

export interface DirectionHint {
  /** Action label to show, or null to omit (skip with tags). */
  actionLabel: string | null;
  /** Tags this direction adds. */
  addTags: Array<string>;
  /** Tags this direction removes. */
  removeTags: Array<string>;
  /** When the total exceeds the max, show counts instead of per-line lists. */
  overflow: boolean;
}

/**
 * Build the tag hint for one swipe direction, or null when it has no tags.
 *
 * - Skip + tags drops the (meaningless) "Skip" label and shows just the tags.
 * - Any other action shows the action label plus its tags.
 * - More than `maxTags` total tags collapse to counts instead of per-line lists.
 */
export function buildDirectionHint(
  binding: ReviewSwipeBinding,
  maxTags = MAX_HINT_TAGS,
): DirectionHint | null {
  const addTags = getTagActions(binding.secondaryActions, "addTag").map(
    (a) => a.tag,
  );
  const removeTags = getTagActions(binding.secondaryActions, "removeTag").map(
    (a) => a.tag,
  );
  if (addTags.length + removeTags.length === 0) return null;

  const actionLabel =
    binding.fileAction === "skip"
      ? null
      : binding.fileAction.charAt(0).toUpperCase() +
        binding.fileAction.slice(1);

  return {
    actionLabel,
    addTags,
    removeTags,
    overflow: addTags.length + removeTags.length > maxTags,
  };
}

/** Muted semantic colours for added vs removed tags. */
const ADD_TAG_CLASS = "text-emerald-700 dark:text-emerald-400";
const REMOVE_TAG_CLASS = "text-destructive";

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
            {hint.overflow ? (
              <span className="flex items-center gap-1">
                {hint.addTags.length > 0 && (
                  <span className={ADD_TAG_CLASS}>+{hint.addTags.length}</span>
                )}
                {hint.removeTags.length > 0 && (
                  <span className={REMOVE_TAG_CLASS}>
                    −{hint.removeTags.length}
                  </span>
                )}
                <span className="text-muted-foreground">tags</span>
              </span>
            ) : (
              <>
                {hint.addTags.map((tag) => (
                  <span
                    key={`add-${tag}`}
                    className={cn("max-w-[20ch] truncate", ADD_TAG_CLASS)}
                  >
                    +{tag}
                  </span>
                ))}
                {hint.removeTags.map((tag) => (
                  <span
                    key={`remove-${tag}`}
                    className={cn("max-w-[20ch] truncate", REMOVE_TAG_CLASS)}
                  >
                    −{tag}
                  </span>
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
