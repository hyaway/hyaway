// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
} from "@tabler/icons-react";
import { getSwipeBindingDescriptor } from "./review-swipe-descriptors";
import type { ReviewDirectionStats } from "@/stores/review-queue-store";
import type {
  SwipeBindings,
  SwipeDirection,
} from "@/stores/review-settings-store";
import { cn } from "@/lib/utils";
import { SWIPE_DIRECTIONS } from "@/stores/review-settings-store";
import { useRatingServiceNames } from "@/integrations/hydrus-api/queries/use-rating-services";

const DIRECTION_ICONS: Record<
  SwipeDirection,
  React.ComponentType<{ className?: string }>
> = {
  left: IconArrowLeft,
  right: IconArrowRight,
  up: IconArrowUp,
  down: IconArrowDown,
};

export interface ReviewStatsBreakdownProps {
  /** Counts per direction from review history */
  stats: ReviewDirectionStats;
  /** Current swipe bindings to derive labels/icons from */
  bindings: SwipeBindings;
  /** Display variant */
  variant: "inline" | "grid";
  /** Whether to hide directions with zero count (default: true) */
  hideZero?: boolean;
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
  className,
}: ReviewStatsBreakdownProps) {
  const serviceNames = useRatingServiceNames();

  // Filter to only directions that have bindings (and optionally non-zero counts)
  const visibleDirections = SWIPE_DIRECTIONS.filter((direction) => {
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
          "flex items-center justify-center gap-3 text-sm tabular-nums",
          className,
        )}
      >
        {visibleDirections.map((direction) => (
          <InlineStatItem
            key={direction}
            direction={direction}
            count={stats[direction]}
            bindings={bindings}
            serviceNames={serviceNames}
          />
        ))}
      </div>
    );
  }

  // Grid variant
  return (
    <div className={cn("grid grid-cols-4 gap-4 text-center", className)}>
      {visibleDirections.map((direction) => (
        <GridStatItem
          key={direction}
          direction={direction}
          count={stats[direction]}
          bindings={bindings}
          serviceNames={serviceNames}
        />
      ))}
    </div>
  );
}

interface StatItemProps {
  direction: SwipeDirection;
  count: number;
  bindings: SwipeBindings;
  serviceNames: Map<string, string>;
}

function InlineStatItem({
  direction,
  count,
  bindings,
  serviceNames,
}: StatItemProps) {
  const binding = bindings[direction];
  const descriptor = getSwipeBindingDescriptor(binding, serviceNames);

  return (
    <span className={descriptor.textClass}>
      {count} {descriptor.label.toLowerCase()}
    </span>
  );
}

function GridStatItem({
  direction,
  count,
  bindings,
  serviceNames,
}: StatItemProps) {
  const binding = bindings[direction];
  const descriptor = getSwipeBindingDescriptor(binding, serviceNames);
  const ActionIcon = descriptor.icon;
  const DirectionIcon = DIRECTION_ICONS[direction];

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          descriptor.bgClass,
          descriptor.textClass,
        )}
      >
        <ActionIcon className="size-5" />
      </div>
      <span className="text-2xl font-semibold tabular-nums">{count}</span>
      <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
        <DirectionIcon className="size-3" />
        {descriptor.label}
      </span>
    </div>
  );
}
