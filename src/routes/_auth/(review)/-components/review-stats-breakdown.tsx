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
import type { ReviewDirectionStats } from "@/stores/review-queue-store";
import type {
  SwipeBindings,
  SwipeDirection,
} from "@/stores/review-settings-store";
import type { RatingServiceInfo } from "@/integrations/hydrus-api/models";
import { cn } from "@/lib/utils";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";

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
  const { servicesMap } = useRatingServices();

  // Filter to only directions that have bindings (and optionally non-zero counts)
  const visibleDirections = DISPLAY_DIRECTIONS.filter((direction) => {
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
            {index > 0 && (
              <IconCircleFilled className="text-muted-foreground size-1" />
            )}
            <InlineStatItem
              direction={direction}
              count={stats[direction]}
              bindings={bindings}
              services={servicesMap}
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
        "grid grid-cols-2 gap-4 text-center min-[250px]:grid-cols-4",
        className,
      )}
    >
      {visibleDirections.map((direction) => (
        <GridStatItem
          key={direction}
          direction={direction}
          count={stats[direction]}
          bindings={bindings}
          services={servicesMap}
        />
      ))}
    </div>
  );
}

interface StatItemProps {
  direction: SwipeDirection;
  count: number;
  bindings: SwipeBindings;
  services: Map<string, RatingServiceInfo>;
}

function InlineStatItem({
  direction,
  count,
  bindings,
  services,
}: StatItemProps) {
  const binding = bindings[direction];
  const descriptor = getSwipeBindingDescriptor(binding, services);
  const DirectionIcon = DIRECTION_ICONS[direction];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap",
        descriptor.textClass,
      )}
    >
      {count} {descriptor.label.toLowerCase()}
      <DirectionIcon className="size-3" />
    </span>
  );
}

function GridStatItem({ direction, count, bindings, services }: StatItemProps) {
  const binding = bindings[direction];
  const descriptor = getSwipeBindingDescriptor(binding, services);
  const ActionIcon = descriptor.icon;
  const DirectionIcon = DIRECTION_ICONS[direction];

  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
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
      <span className="text-muted-foreground text-center text-xs leading-tight break-all">
        {descriptor.label}
      </span>
    </div>
  );
}
