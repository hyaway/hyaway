// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createElement } from "react";
import { useNavigate } from "@tanstack/react-router";
import { IconCards } from "@tabler/icons-react";
import type { ComponentType, SVGProps } from "react";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { ReviewSource } from "@/stores/review-queue-store";
import {
  useReviewQueueActions,
  useReviewQueueRemaining,
} from "@/stores/review-queue-store";

/** Cards icon with a plus badge overlapping the front card */
const IconCardsPlus: ComponentType<SVGProps<SVGSVGElement>> = (props) =>
  createElement(
    "span",
    { className: "inline-flex items-center" },
    createElement(IconCards, props),
    createElement(
      "span",
      {
        className:
          "-ml-1.5 text-xl font-normal [-webkit-text-stroke:3px_var(--color-muted)]",
      },
      "+",
    ),
    createElement(
      "span",
      {
        className: "-ml-[1ch] text-xl font-normal",
      },
      "+",
    ),
  );

interface UseReviewActionsOptions {
  /** File IDs to add to review queue */
  fileIds: Array<number>;
  /** Source view to hide files from when review hide settings apply. */
  source?: ReviewSource;
}

/**
 * Hook that provides review queue actions for gallery pages.
 * Returns an array of FloatingFooterAction objects ready to pass to PageFloatingFooter.
 */
export function useReviewActions({
  fileIds,
  source,
}: UseReviewActionsOptions): Array<FloatingFooterAction> {
  const navigate = useNavigate();
  const { setQueue, addToQueue } = useReviewQueueActions();
  const queueRemaining = useReviewQueueRemaining();

  const hasFiles = fileIds.length > 0;

  const handleReview = () => {
    if (!hasFiles) return;
    setQueue(fileIds, source);
    navigate({ to: "/review" });
  };

  const handleAddToQueue = () => {
    if (!hasFiles) return;
    addToQueue(fileIds, source);
    navigate({ to: "/review" });
  };

  if (!hasFiles) {
    return [];
  }

  if (queueRemaining > 0) {
    return [
      {
        id: "review-replace",
        label: "New review",
        icon: IconCards,
        onClick: handleReview,
      },
      {
        id: "review-add",
        label: "Add to review",
        icon: IconCardsPlus,
        onClick: handleAddToQueue,
      },
    ];
  }

  return [
    {
      id: "review",
      label: "Review",
      icon: IconCards,
      onClick: handleReview,
    },
  ];
}
