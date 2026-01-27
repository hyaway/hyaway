// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconCrosshair } from "@tabler/icons-react";
import { motion, useMotionTemplate, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import type { CardSize } from "./review-swipe-card";

export interface ReviewThresholdOverlayProps {
  /** Motion value for x position */
  x: MotionValue<number>;
  /** Motion value for y position */
  y: MotionValue<number>;
  /** Card dimensions for percentage calculations */
  cardSize: CardSize;
  /** Horizontal threshold as percentage from center */
  horizontalThresholdPercent: number;
  /** Vertical threshold as percentage from center */
  verticalThresholdPercent: number;
}

/** Debug overlay showing gesture threshold zones and grid */
export function ReviewThresholdOverlay({
  x,
  y,
  cardSize,
  horizontalThresholdPercent,
  verticalThresholdPercent,
}: ReviewThresholdOverlayProps) {
  // Calculate percentage coordinates for crosshair label (doubled to match settings display)
  // Negate y so up is positive (DOM y-axis is inverted)
  const xPercent = useTransform(x, (xVal) =>
    cardSize.width > 0 ? Math.round((xVal / cardSize.width) * 100 * 2) : 0,
  );
  const yPercent = useTransform(y, (yVal) =>
    cardSize.height > 0 ? Math.round((-yVal / cardSize.height) * 100 * 2) : 0,
  );
  const coordsLabel = useMotionTemplate`${xPercent}%, ${yPercent}%`;

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
      {/* Trash zone area (left of center, below skip threshold) */}
      <div
        className="bg-destructive/50 absolute bottom-0 left-0 flex items-center justify-center"
        style={{
          width: `calc(50% - ${horizontalThresholdPercent}%)`,
          top: `calc(50% - ${verticalThresholdPercent}%)`,
        }}
      >
        <span className="bg-background text-foreground flex flex-col items-center px-1 text-xs font-bold">
          <span>TRASH</span>
          <span>{horizontalThresholdPercent * 2}%</span>
        </span>
      </div>
      {/* Archive zone area (right of center, below skip threshold) */}
      <div
        className="bg-primary/50 absolute right-0 bottom-0 flex items-center justify-center"
        style={{
          width: `calc(50% - ${horizontalThresholdPercent}%)`,
          top: `calc(50% - ${verticalThresholdPercent}%)`,
        }}
      >
        <span className="bg-background text-foreground flex flex-col items-center px-1 text-xs font-bold">
          <span>ARCHIVE</span>
          <span>{horizontalThresholdPercent * 2}%</span>
        </span>
      </div>
      {/* Skip zone area (above center, full width) */}
      <div
        className="bg-muted/50 absolute top-0 right-0 left-0 flex items-center justify-center"
        style={{ height: `calc(50% - ${verticalThresholdPercent}%)` }}
      >
        <span className="bg-background text-foreground flex flex-col items-center px-1 text-xs font-bold">
          <span>SKIP</span>
          <span>{verticalThresholdPercent * 2}%</span>
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
      {/* Trash threshold line (left of center, below skip threshold) */}
      <div
        className="bg-destructive absolute bottom-0 w-0.5"
        style={{
          left: `calc(50% - ${horizontalThresholdPercent}%)`,
          top: `calc(50% - ${verticalThresholdPercent}%)`,
        }}
      />
      {/* Archive threshold line (right of center, below skip threshold) */}
      <div
        className="bg-primary absolute bottom-0 w-0.5"
        style={{
          left: `calc(50% + ${horizontalThresholdPercent}%)`,
          top: `calc(50% - ${verticalThresholdPercent}%)`,
        }}
      />
      {/* Skip threshold line (above center) */}
      <div
        className="bg-muted-foreground absolute right-0 left-0 h-0.5"
        style={{ top: `calc(50% - ${verticalThresholdPercent}%)` }}
      />
    </div>
  );
}
