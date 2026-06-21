// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconCircleFilled,
} from "@tabler/icons-react";
import { getSwipeBindingDescriptor } from "./review-swipe-descriptors";
import type { Icon } from "@tabler/icons-react";
import type { ReviewDirectionStats } from "@/stores/review-queue-store";
import type {
  SwipeBindings,
  SwipeDirection,
} from "@/stores/review-settings-store";
import type {
  LocalTagServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import { Button } from "@/components/ui-primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui-primitives/tooltip";
import { cn } from "@/lib/utils";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { useLocalTagServices } from "@/integrations/hydrus-api/queries/services";

const DIRECTION_ICONS: Record<SwipeDirection, Icon> = {
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

export interface ReviewStatsBreakdownProps {
  /** Counts per direction from review history */
  stats: ReviewDirectionStats;
  /** Current swipe bindings to derive labels/icons from */
  bindings: SwipeBindings;
  /** Display variant */
  variant: "inline" | "grid";
  /** Whether to hide directions with zero count (default: true) */
  hideZero?: boolean;
  /** Whether to show action labels (default: true, inline variant only) */
  showLabels?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Displays review action counts with labels and icons derived from swipe bindings.
 * Used in both the in-progress stats header and completion summary.
 */
export function ReviewStatsBreakdown({
  stats,
  bindings,
  variant,
  hideZero = true,
  showLabels = true,
  className,
}: ReviewStatsBreakdownProps) {
  const { ratingServicesByKey } = useRatingServices();
  const { localTagServicesByKey } = useLocalTagServices();

  // Filter to only directions that have bindings (and optionally non-zero counts)
  // Always exclude undo-bound directions since they don't produce countable stats
  const visibleDirections = DISPLAY_DIRECTIONS.filter((direction) => {
    if (bindings[direction].fileAction === "undo") return false;

    const count = stats[direction];

    // Skip if hideZero and count is 0
    if (hideZero && count === 0) return false;

    return true;
  });

  if (visibleDirections.length === 0) {
    return null;
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm tabular-nums",
          className,
        )}
      >
        {visibleDirections.map((direction, index) => (
          <span key={direction} className="inline-flex items-center gap-3">
            {index > 0 && showLabels && (
              <IconCircleFilled className="text-muted-foreground size-1" />
            )}
            <InlineStatItem
              direction={direction}
              count={stats[direction]}
              bindings={bindings}
              ratingServices={ratingServicesByKey}
              tagServices={localTagServicesByKey}
              showLabel={showLabels}
            />
          </span>
        ))}
      </div>
    );
  }

  // Grid variant
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-center gap-4 text-center",
        className,
      )}
    >
      {visibleDirections.map((direction) => (
        <GridStatItem
          key={direction}
          direction={direction}
          count={stats[direction]}
          bindings={bindings}
          ratingServices={ratingServicesByKey}
          tagServices={localTagServicesByKey}
        />
      ))}
    </div>
  );
}

interface StatItemProps {
  direction: SwipeDirection;
  count: number;
  bindings: SwipeBindings;
  ratingServices: Map<string, RatingServiceInfo>;
  tagServices: Map<string, LocalTagServiceInfo>;
  showLabel?: boolean;
}

function InlineStatItem({
  direction,
  count,
  bindings,
  ratingServices,
  tagServices,
  showLabel = true,
}: StatItemProps) {
  const binding = bindings[direction];
  const descriptor = getSwipeBindingDescriptor(
    binding,
    ratingServices,
    tagServices,
  );
  const ActionIcon = descriptor.icon;
  const DirectionIcon = DIRECTION_ICONS[direction];
  const inlineContent = (
    <>
      {count}
      {showLabel && (
        <span className="inline-flex items-center gap-0.5">
          <ActionIcon className="size-4" strokeWidth={2.5} />
          {descriptor.secondaryActionCount > 0 && (
            <span className="text-muted-foreground">
              +{descriptor.secondaryActionCount}
            </span>
          )}
        </span>
      )}
      <DirectionIcon className="size-4" strokeWidth={2.5} />
    </>
  );
  const content = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap",
        descriptor.textClass,
      )}
    >
      {inlineContent}
    </span>
  );
  const trigger = (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Show ${descriptor.label.replace(/\n/g, " ")} details`}
      className={descriptor.textClass}
    >
      {inlineContent}
    </Button>
  );

  if (!showLabel) return content;

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent side="bottom" align="center" className="w-56 gap-2 p-3">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "mt-0.5 flex shrink-0 items-center",
              descriptor.textClass,
            )}
          >
            <ActionIcon className="size-4" strokeWidth={2.5} />
            <DirectionIcon className="size-4" strokeWidth={2.5} />
          </span>
          <span className="text-sm whitespace-pre-line">
            {descriptor.label}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function GridStatItem({
  direction,
  count,
  bindings,
  ratingServices,
  tagServices,
}: StatItemProps) {
  const binding = bindings[direction];
  const descriptor = getSwipeBindingDescriptor(
    binding,
    ratingServices,
    tagServices,
  );
  const ActionIcon = descriptor.icon;
  const DirectionIcon = DIRECTION_ICONS[direction];
  const content = (
    <div className="flex w-20 min-w-0 flex-col items-center gap-1">
      <div
        className={cn(
          "flex size-10 items-center justify-center",
          descriptor.bgClass,
          descriptor.textClass,
        )}
      >
        <ActionIcon className="size-4" />
        <DirectionIcon className="size-4" />
      </div>
      <span className="text-2xl font-semibold tabular-nums">{count}</span>
      <span className="text-muted-foreground text-center text-xs leading-tight break-all whitespace-pre-line">
        {descriptor.label}
      </span>
    </div>
  );

  if (descriptor.secondaryActionCount === 0) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={content} />
      <TooltipContent side="top" className="text-center whitespace-pre-line">
        {descriptor.label}
      </TooltipContent>
    </Tooltip>
  );
}
