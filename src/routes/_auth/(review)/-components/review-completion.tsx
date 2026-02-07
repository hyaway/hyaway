// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useCallback, useMemo } from "react";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconCheck,
} from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";

import { getSwipeBindingDescriptor } from "./review-swipe-descriptors";
import { ReviewDecisionFilmstrip } from "./review-decision-filmstrip";
import { ReviewStatsBreakdown } from "./review-stats-breakdown";
import type {
  ReviewDirectionStats,
  ReviewFileIdsByDirection,
} from "@/stores/review-queue-store";
import type {
  SwipeBindings,
  SwipeDirection,
} from "@/stores/review-settings-store";
import type { RatingServiceInfo } from "@/integrations/hydrus-api/models";
import {
  useReviewQueueActions,
  useReviewQueueHistory,
} from "@/stores/review-queue-store";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { Button } from "@/components/ui-primitives/button";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui-primitives/heading";

const DIRECTION_ICONS: Record<
  SwipeDirection,
  React.ComponentType<{ className?: string }>
> = {
  left: IconArrowLeft,
  right: IconArrowRight,
  up: IconArrowUp,
  down: IconArrowDown,
};

/** Display order matches vim hjkl: left, down, up, right */
const DISPLAY_DIRECTIONS: ReadonlyArray<SwipeDirection> = [
  "left",
  "down",
  "up",
  "right",
];

interface ReviewCompletionProps {
  stats: ReviewDirectionStats;
  bindings: SwipeBindings;
}

export function ReviewCompletion({ stats, bindings }: ReviewCompletionProps) {
  const { clearQueue } = useReviewQueueActions();
  const navigate = useNavigate();
  const total = stats.left + stats.right + stats.up + stats.down;
  const history = useReviewQueueHistory();
  const { servicesMap } = useRatingServices();

  // Derive file IDs by direction from history - stable reference via useMemo
  const fileIdsByDirection = useMemo(() => {
    const byDirection: ReviewFileIdsByDirection = {
      left: [],
      right: [],
      up: [],
      down: [],
    };
    for (const entry of history) {
      byDirection[entry.direction].push(entry.fileId);
    }
    return byDirection;
  }, [history]);

  const handleClearAndBrowse = useCallback(() => {
    clearQueue();
    navigate({ to: "/pages", search: { q: undefined } });
  }, [clearQueue, navigate]);

  // Directions that actually have files assigned
  const activeDirections = useMemo(
    () => DISPLAY_DIRECTIONS.filter((d) => fileIdsByDirection[d].length > 0),
    [fileIdsByDirection],
  );

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Header section - centered with max width */}
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 px-4">
        {/* Success icon */}
        <div className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-xl">
          <IconCheck className="size-10" strokeWidth={2.5} />
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Review complete!</h2>
          <p className="text-muted-foreground mt-1">
            You reviewed {total} {total === 1 ? "file" : "files"}
          </p>
        </div>

        {/* Stats */}
        <ReviewStatsBreakdown
          stats={stats}
          bindings={bindings}
          variant="grid"
          hideZero={false}
        />
      </div>

      {/* Decision filmstrips - only for directions with files */}
      {activeDirections.length > 0 && (
        <div className="flex w-full flex-col gap-6">
          <Heading level={3} className="text-center leading-normal">
            Review breakdown
          </Heading>
          {activeDirections.map((direction) => (
            <DecisionFilmstripSection
              key={direction}
              direction={direction}
              fileIds={fileIdsByDirection[direction]}
              bindings={bindings}
              servicesMap={servicesMap}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex w-full flex-col items-center gap-2">
        <Heading level={3}>What's next</Heading>
        <div className="flex flex-row flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={clearQueue}>
            Configure actions
          </Button>
          <Button variant="outline" onClick={handleClearAndBrowse}>
            Browse pages
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DecisionFilmstripSectionProps {
  direction: SwipeDirection;
  fileIds: Array<number>;
  bindings: SwipeBindings;
  servicesMap: Map<string, RatingServiceInfo>;
}

const DecisionFilmstripSection = memo(function DecisionFilmstripSection({
  direction,
  fileIds,
  bindings,
  servicesMap,
}: DecisionFilmstripSectionProps) {
  const binding = bindings[direction];
  const descriptor = useMemo(
    () => getSwipeBindingDescriptor(binding, servicesMap),
    [binding, servicesMap],
  );
  const ActionIcon = descriptor.icon;
  const DirectionIcon = DIRECTION_ICONS[direction];

  return (
    <div className="w-full">
      <Heading
        level={4}
        className="flex items-start justify-center gap-2 leading-normal"
      >
        <div
          className={cn(
            "hidden aspect-square size-8 items-center justify-center rounded-lg min-[400px]:inline-flex",
            descriptor.bgClass,
            descriptor.textClass,
          )}
        >
          <ActionIcon className="size-3" />
          <DirectionIcon className="size-3" />
        </div>
        <span>
          {descriptor.label}{" "}
          <span className="text-muted-foreground font-normal tabular-nums">
            ({fileIds.length})
          </span>
        </span>
      </Heading>
      <ReviewDecisionFilmstrip fileIds={fileIds} />
    </div>
  );
});
