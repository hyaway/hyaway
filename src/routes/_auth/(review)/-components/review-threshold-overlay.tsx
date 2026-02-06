// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconCrosshair } from "@tabler/icons-react";
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useTransform,
} from "motion/react";
import { getSwipeBindingOverlayDescriptor } from "./review-swipe-descriptors";
import type { MotionValue } from "motion/react";
import type { CardSize } from "./review-swipe-card";
import type { SwipeThresholds } from "@/stores/review-settings-store";
import { useReviewSwipeBindings } from "@/stores/review-settings-store";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { cn } from "@/lib/utils";

export interface ReviewThresholdOverlayProps {
  /** Motion value for x position */
  x: MotionValue<number>;
  /** Motion value for y position */
  y: MotionValue<number>;
  /** Card dimensions for percentage calculations */
  cardSize: CardSize;
  /** Threshold percentages for each direction */
  thresholds: SwipeThresholds;
}

/** Debug overlay showing gesture threshold zones and grid */
export function ReviewThresholdOverlay({
  x,
  y,
  cardSize,
  thresholds,
}: ReviewThresholdOverlayProps) {
  const bindings = useReviewSwipeBindings();
  const { servicesMap } = useRatingServices();
  // Get descriptors for each direction
  const leftDescriptor = getSwipeBindingOverlayDescriptor(
    bindings.left,
    servicesMap,
  );
  const rightDescriptor = getSwipeBindingOverlayDescriptor(
    bindings.right,
    servicesMap,
  );
  const upDescriptor = getSwipeBindingOverlayDescriptor(
    bindings.up,
    servicesMap,
  );
  const downDescriptor = getSwipeBindingOverlayDescriptor(
    bindings.down,
    servicesMap,
  );

  // Calculate percentage coordinates for crosshair label (doubled to match settings display)
  // Negate y so up is positive (DOM y-axis is inverted)
  const xPercent = useTransform(x, (xVal) =>
    cardSize.width > 0 ? Math.round((xVal / cardSize.width) * 100 * 2) : 0,
  );
  const yPercent = useTransform(y, (yVal) =>
    cardSize.height > 0 ? Math.round((-yVal / cardSize.height) * 100 * 2) : 0,
  );
  const coordsLabel = useMotionTemplate`X ${xPercent}%, Y ${yPercent}%`;

  // Debug logging for crosshair position
  useMotionValueEvent(y, "change", (yVal) => {
    const xVal = x.get();
    const rawXPercent = cardSize.width > 0 ? (xVal / cardSize.width) * 100 : 0;
    const rawYPercent =
      cardSize.height > 0 ? (-yVal / cardSize.height) * 100 : 0;
    console.log(
      "[Crosshair]",
      JSON.stringify({
        raw: { x: xVal, y: yVal },
        rawPercent: { x: rawXPercent, y: rawYPercent },
        displayedPercent: { x: rawXPercent * 2, y: rawYPercent * 2 },
        thresholds,
      }),
    );
  });

  // Threshold rectangle corners (as percentages from center, for CSS positioning)
  // Each direction can have a different threshold
  const thresholdLeft = 50 - thresholds.left;
  const thresholdRight = 50 + thresholds.right;
  const thresholdTop = 50 - thresholds.up;
  const thresholdBottom = 50 + thresholds.down;

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {/* Percentage grid lines - horizontal (from center, every 20% displayed) */}
      {[10, 20, 30, 40].map((percent) => (
        <div key={`h-${percent}`}>
          {/* Left of center */}
          <div
            className="absolute top-0 bottom-0 w-px bg-white/20"
            style={{ left: `calc(50% - ${percent}%)` }}
          >
            <span className="bg-background/80 text-muted-foreground absolute bottom-1 left-1/2 -translate-x-1/2 px-1 text-[10px]">
              {percent * 2}%
            </span>
          </div>
          {/* Right of center */}
          <div
            className="absolute top-0 bottom-0 w-px bg-white/20"
            style={{ left: `calc(50% + ${percent}%)` }}
          >
            <span className="bg-background/80 text-muted-foreground absolute bottom-1 left-1/2 -translate-x-1/2 px-1 text-[10px]">
              {percent * 2}%
            </span>
          </div>
        </div>
      ))}
      {/* Percentage grid lines - vertical (from center, every 20% displayed) */}
      {[10, 20, 30, 40].map((percent) => (
        <div key={`v-${percent}`}>
          {/* Above center */}
          <div
            className="absolute right-0 left-0 h-px bg-white/20"
            style={{ top: `calc(50% - ${percent}%)` }}
          >
            <span className="bg-background/80 text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2 px-1 text-[10px]">
              {percent * 2}%
            </span>
          </div>
          {/* Below center */}
          <div
            className="absolute right-0 left-0 h-px bg-white/20"
            style={{ top: `calc(50% + ${percent}%)` }}
          >
            <span className="bg-background/80 text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2 px-1 text-[10px]">
              {percent * 2}%
            </span>
          </div>
        </div>
      ))}
      {/* Center lines */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-yellow-500/50" />
      <div className="absolute top-1/2 right-0 left-0 h-px bg-yellow-500/50" />

      {/* Left zone - trapezoid from left edge to threshold, bounded by diagonals */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-start pl-4",
          leftDescriptor.bgClass,
          "opacity-50",
        )}
        style={{
          clipPath: `polygon(0 0, ${thresholdLeft}% ${thresholdTop}%, ${thresholdLeft}% ${thresholdBottom}%, 0 100%)`,
        }}
      >
        <span className="bg-background text-foreground flex flex-col items-center px-1 text-xs font-bold">
          <span>{leftDescriptor.label.toUpperCase()}</span>
          <span>{thresholds.left * 2}%</span>
        </span>
      </div>

      {/* Right zone - trapezoid from right edge to threshold */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-end pr-4",
          rightDescriptor.bgClass,
          "opacity-50",
        )}
        style={{
          clipPath: `polygon(100% 0, ${thresholdRight}% ${thresholdTop}%, ${thresholdRight}% ${thresholdBottom}%, 100% 100%)`,
        }}
      >
        <span className="bg-background text-foreground flex flex-col items-center px-1 text-xs font-bold">
          <span>{rightDescriptor.label.toUpperCase()}</span>
          <span>{thresholds.right * 2}%</span>
        </span>
      </div>

      {/* Up zone - trapezoid from top edge to threshold */}
      <div
        className={cn(
          "absolute inset-0 flex items-start justify-center pt-4",
          upDescriptor.bgClass,
          "opacity-50",
        )}
        style={{
          clipPath: `polygon(0 0, ${thresholdLeft}% ${thresholdTop}%, ${thresholdRight}% ${thresholdTop}%, 100% 0)`,
        }}
      >
        <span className="bg-background text-foreground flex flex-col items-center px-1 text-xs font-bold">
          <span>{upDescriptor.label.toUpperCase()}</span>
          <span>{thresholds.up * 2}%</span>
        </span>
      </div>

      {/* Down zone - trapezoid from bottom edge to threshold */}
      <div
        className={cn(
          "absolute inset-0 flex items-end justify-center pb-4",
          downDescriptor.bgClass,
          "opacity-50",
        )}
        style={{
          clipPath: `polygon(0 100%, ${thresholdLeft}% ${thresholdBottom}%, ${thresholdRight}% ${thresholdBottom}%, 100% 100%)`,
        }}
      >
        <span className="bg-background text-foreground flex flex-col items-center px-1 text-xs font-bold">
          <span>{downDescriptor.label.toUpperCase()}</span>
          <span>{thresholds.down * 2}%</span>
        </span>
      </div>

      {/* Center crosshair - moves with card */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ x, y }}
      >
        <IconCrosshair className="size-6 text-yellow-500" />
        <motion.span className="bg-background text-foreground absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded px-1 text-[10px] font-bold whitespace-nowrap">
          {coordsLabel}
        </motion.span>
      </motion.div>

      {/* SVG for diagonal lines from center to threshold corners */}
      <svg className="absolute inset-0 h-full w-full">
        {/* Diagonal from top-left threshold corner to top-left image corner */}
        <line
          x1={`${thresholdLeft}%`}
          y1={`${thresholdTop}%`}
          x2="0%"
          y2="0%"
          stroke="#eab308"
          strokeWidth="2"
        />
        {/* Diagonal from top-right threshold corner to top-right image corner */}
        <line
          x1={`${thresholdRight}%`}
          y1={`${thresholdTop}%`}
          x2="100%"
          y2="0%"
          stroke="#eab308"
          strokeWidth="2"
        />
        {/* Diagonal from bottom-right threshold corner to bottom-right image corner */}
        <line
          x1={`${thresholdRight}%`}
          y1={`${thresholdBottom}%`}
          x2="100%"
          y2="100%"
          stroke="#eab308"
          strokeWidth="2"
        />
        {/* Diagonal from bottom-left threshold corner to bottom-left image corner */}
        <line
          x1={`${thresholdLeft}%`}
          y1={`${thresholdBottom}%`}
          x2="0%"
          y2="100%"
          stroke="#eab308"
          strokeWidth="2"
        />
        {/* Threshold rectangle outline */}
        <rect
          x={`${thresholdLeft}%`}
          y={`${thresholdTop}%`}
          width={`${thresholds.left + thresholds.right}%`}
          height={`${thresholds.up + thresholds.down}%`}
          fill="none"
          stroke="#eab308"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
