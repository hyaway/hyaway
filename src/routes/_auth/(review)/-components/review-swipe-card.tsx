// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useRef, useState } from "react";
import { IconArchive, IconArrowUp, IconTrash } from "@tabler/icons-react";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from "motion/react";
import { ReviewThresholdOverlay } from "./review-threshold-overlay";
import type { MotionValue, PanInfo } from "motion/react";
import type { ReviewAction } from "@/stores/review-queue-store";
import {
  useReviewHorizontalThreshold,
  useReviewShowGestureThresholds,
  useReviewVerticalThreshold,
} from "@/stores/review-queue-store";
import { cn } from "@/lib/utils";

/** Distance before overlay starts appearing (as fraction of threshold) */
const OVERLAY_START = 0.4;
/** Vertical overlay starts later and ramps faster (higher = later start) */
const VERTICAL_OVERLAY_START = 0.6;
/** Max rotation angle in degrees */
const MAX_ROTATION = 12;
/** Touch movement (px) before we start a swipe drag */
const TOUCH_SWIPE_START_DISTANCE = 6;

export type SwipeDirection = "left" | "right" | "up" | "down" | null;

/** Swipe zone detection result */
type SwipeZone = "skip" | "trash" | "archive" | null;

/**
 * Determine which swipe zone we're in based on coordinates.
 * Skip (up) takes priority, then horizontal actions apply.
 */
function getSwipeZone(
  xVal: number,
  yVal: number,
  horizontalThreshold: number,
  verticalThreshold: number,
): SwipeZone {
  // Skip takes priority when swiping up past threshold
  if (yVal < -verticalThreshold) return "skip";
  // Horizontal zones
  if (xVal < -horizontalThreshold) return "trash";
  if (xVal > horizontalThreshold) return "archive";
  return null;
}

/** Calculate overlay opacity for a zone based on progress toward threshold */
function getZoneOpacity(
  xVal: number,
  yVal: number,
  zone: "skip" | "trash" | "archive",
  horizontalThreshold: number,
  verticalThreshold: number,
): number {
  const horizontalStart = horizontalThreshold * OVERLAY_START;
  const verticalStart = verticalThreshold * VERTICAL_OVERLAY_START;

  // Determine which zone is currently "active" based on which threshold we're closer to
  // Skip zone wins when: past skip threshold OR (approaching skip AND vertical > horizontal progress)
  const inSkipZone = yVal < -verticalThreshold;
  const skipProgress =
    yVal >= -verticalStart
      ? 0
      : (-yVal - verticalStart) / (verticalThreshold - verticalStart);

  const horizontalProgress =
    xVal >= -horizontalStart && xVal <= horizontalStart
      ? 0
      : xVal < 0
        ? (-xVal - horizontalStart) / (horizontalThreshold - horizontalStart)
        : (xVal - horizontalStart) / (horizontalThreshold - horizontalStart);

  // Skip zone takes priority when past threshold or when skip progress > horizontal progress
  const skipWins =
    inSkipZone || (skipProgress > 0 && skipProgress >= horizontalProgress);

  switch (zone) {
    case "skip": {
      if (!skipWins && horizontalProgress > 0) return 0;
      if (inSkipZone) return 1;
      if (yVal >= -verticalStart) return 0;
      return Math.min(1, skipProgress);
    }
    case "trash": {
      if (skipWins) return 0;
      if (xVal >= -horizontalStart) return 0;
      return Math.min(1, horizontalProgress);
    }
    case "archive": {
      if (skipWins) return 0;
      if (xVal <= horizontalStart) return 0;
      return Math.min(1, horizontalProgress);
    }
  }
}

/** Card dimensions for threshold calculations */
export interface CardSize {
  width: number;
  height: number;
}

export interface ReviewSwipeCardProps {
  /** The file ID being displayed */
  fileId: number;
  /** Whether this is the top card (interactive) */
  isTop: boolean;
  /** Stack position (0 = top, 1 = second, etc.) */
  stackIndex: number;
  /** Card dimensions for calculating percentage-based thresholds */
  cardSize: CardSize;
  /** Content to render inside the card */
  children: React.ReactNode;
  /** Exit direction for animation (triggers exit when set) */
  exitDirection?: SwipeDirection;
  /** Whether swipe gestures are enabled */
  gesturesEnabled?: boolean;
  /** Callback when swipe completes with a direction */
  onSwipe: (direction: SwipeDirection, action: ReviewAction) => void;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
}

/** Map swipe direction to action */
function getActionFromDirection(
  direction: SwipeDirection,
): ReviewAction | null {
  switch (direction) {
    case "left":
      return "trash";
    case "right":
      return "archive";
    case "up":
      return "skip";
    default:
      return null;
  }
}

/** Get exit animation coordinates based on direction */
function getExitCoords(direction: SwipeDirection) {
  switch (direction) {
    case "left":
      return { x: -500, y: 0 };
    case "right":
      return { x: 500, y: 0 };
    case "up":
      return { x: 0, y: -400 };
    case "down":
      return { x: 0, y: 400 };
    default:
      return { x: 0, y: 0 };
  }
}

export const ReviewSwipeCard = memo(function ReviewSwipeCard({
  fileId,
  isTop,
  stackIndex,
  cardSize,
  children,
  exitDirection,
  gesturesEnabled = true,
  onSwipe,
  onExitComplete,
}: ReviewSwipeCardProps) {
  const isExiting = exitDirection != null;
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isPinching, setIsPinching] = useState(false);
  // Prevent accidental swipe when a pinch gesture ends.
  // We require all touch pointers to lift before allowing a swipe to complete.
  const activeTouchPointersRef = useRef(new Set<number>());
  const pinchCooldownRef = useRef(false);
  const pendingTouchSwipeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    eligible: boolean;
    started: boolean;
  } | null>(null);

  // Get threshold settings from store (percentages)
  const showGestureThresholds = useReviewShowGestureThresholds();
  const horizontalThresholdPercent = useReviewHorizontalThreshold();
  const verticalThresholdPercent = useReviewVerticalThreshold();

  // Convert percentage thresholds to pixels based on card dimensions
  const horizontalThresholdPx =
    (cardSize.width * horizontalThresholdPercent) / 100;
  const verticalThresholdPx =
    (cardSize.height * verticalThresholdPercent) / 100;

  // Calculate rotation based on horizontal drag
  const rotate = useTransform(
    x,
    [-200, 0, 200],
    [-MAX_ROTATION, 0, MAX_ROTATION],
  );

  // Calculate opacity for intent overlays using shared zone logic
  const trashOpacity = useTransform(x, (xVal) =>
    getZoneOpacity(
      xVal,
      y.get(),
      "trash",
      horizontalThresholdPx,
      verticalThresholdPx,
    ),
  );
  const archiveOpacity = useTransform(x, (xVal) =>
    getZoneOpacity(
      xVal,
      y.get(),
      "archive",
      horizontalThresholdPx,
      verticalThresholdPx,
    ),
  );
  const skipOpacity = useTransform(y, (yVal) =>
    getZoneOpacity(
      x.get(),
      yVal,
      "skip",
      horizontalThresholdPx,
      verticalThresholdPx,
    ),
  );

  // Scale for stacked cards (cards behind are slightly smaller)
  const stackScale = 1 - stackIndex * 0.05;
  const stackY = stackIndex * 8;

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    // Ignore drag end if we just finished pinching
    if (pinchCooldownRef.current) {
      return;
    }

    const { offset } = info;
    const zone = getSwipeZone(
      offset.x,
      offset.y,
      horizontalThresholdPx,
      verticalThresholdPx,
    );

    if (zone) {
      // Map zone to direction
      const direction: SwipeDirection =
        zone === "skip" ? "up" : zone === "trash" ? "left" : "right";
      const action = getActionFromDirection(direction);
      if (action) {
        onSwipe(direction, action);
      }
    }
  };

  // Exit animation values
  const exitCoords = exitDirection
    ? getExitCoords(exitDirection)
    : { x: 0, y: 0 };

  // Exiting cards need highest z-index to stay on top during animation
  const zIndex = isExiting ? 20 : 10 - stackIndex;

  return (
    <div
      ref={constraintsRef}
      className={cn(
        "absolute inset-0",
        // Exiting cards must not capture pointer events - let them pass through to the new top card
        isExiting ? "pointer-events-none" : "pointer-events-auto",
      )}
      style={{ zIndex }}
    >
      {/* Debug zone visualization - shows threshold areas and lines from center */}
      {showGestureThresholds && isTop && (
        <ReviewThresholdOverlay
          x={x}
          y={y}
          cardSize={cardSize}
          horizontalThresholdPercent={horizontalThresholdPercent}
          verticalThresholdPercent={verticalThresholdPercent}
        />
      )}
      <motion.div
        key={fileId}
        className={cn(
          "bg-card border-border absolute inset-0 touch-none overflow-hidden rounded-lg border shadow-lg",
          isTop && gesturesEnabled
            ? "cursor-grab active:cursor-grabbing"
            : "pointer-events-none",
        )}
        style={{
          x,
          y,
          rotate,
          scale: stackScale,
          translateY: stackY,
        }}
        drag={isTop && !isExiting && gesturesEnabled && !isPinching}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
        onPointerMove={(e) => {
          if (!isTop || isExiting || !gesturesEnabled) return;
          if (e.pointerType !== "touch") return;
          if (isPinching || pinchCooldownRef.current) return;

          const pending = pendingTouchSwipeRef.current;
          if (!pending) return;
          if (pending.pointerId !== e.pointerId) return;
          if (!pending.eligible || pending.started) return;

          const dx = e.clientX - pending.startX;
          const dy = e.clientY - pending.startY;
          const distance = Math.hypot(dx, dy);

          if (distance < TOUCH_SWIPE_START_DISTANCE) return;

          // Now that we know this is a deliberate swipe, start drag.
          // Avoid setting pointer capture for touch here so nested pinch handlers
          // keep receiving pointer moves.
          dragControls.start(e, { snapToCursor: false });
          pendingTouchSwipeRef.current = { ...pending, started: true };
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== "touch") return;
          activeTouchPointersRef.current.delete(e.pointerId);

          const pending = pendingTouchSwipeRef.current;
          if (pending?.pointerId === e.pointerId) {
            pendingTouchSwipeRef.current = null;
          }

          if (activeTouchPointersRef.current.size < 2 && isPinching) {
            setIsPinching(false);
            // Reset position to prevent accidental swipe from pinch offset
            animate(x, 0, { duration: 0.15 });
            animate(y, 0, { duration: 0.15 });
          }

          // Only re-enable swipes once all touch pointers are lifted.
          if (activeTouchPointersRef.current.size === 0) {
            pinchCooldownRef.current = false;
          }
        }}
        onPointerCancel={(e) => {
          if (e.pointerType !== "touch") return;
          activeTouchPointersRef.current.delete(e.pointerId);

          const pending = pendingTouchSwipeRef.current;
          if (pending?.pointerId === e.pointerId) {
            pendingTouchSwipeRef.current = null;
          }

          if (activeTouchPointersRef.current.size < 2 && isPinching) {
            setIsPinching(false);
            animate(x, 0, { duration: 0.15 });
            animate(y, 0, { duration: 0.15 });
          }

          if (activeTouchPointersRef.current.size === 0) {
            pinchCooldownRef.current = false;
          }
        }}
        onPointerDown={(e) => {
          if (!isTop || isExiting || !gesturesEnabled) return;

          if (e.pointerType === "touch") {
            const target = e.target as HTMLElement;
            // Don't start swiping when interacting with actual media control elements.
            // Be specific: exclude buttons, sliders, interactive elements - NOT entire overlays.
            // .vds-controls is the actual controls bar, not the full player area.
            // Check BEFORE adding to activeTouchPointersRef - if we bail out early,
            // onPointerUp may fire on the control instead of our element, leaving stale IDs.
            if (
              target.closest(
                ".vds-controls, .vds-slider, .vds-button, .vds-menu, button, a, input, textarea, select, [role='slider'], [role='button']",
              )
            ) {
              pendingTouchSwipeRef.current = null;
              return;
            }

            // Don't start swiping when image viewer is in pan mode (zoomed in)
            if (target.closest("[data-pan-mode]")) {
              pendingTouchSwipeRef.current = null;
              return;
            }

            activeTouchPointersRef.current.add(e.pointerId);

            // Two-finger gesture: treat as pinch, block swipe + swipe completion
            if (activeTouchPointersRef.current.size >= 2) {
              setIsPinching(true);
              pinchCooldownRef.current = true;
              // If a swipe drag was started by the first finger, cancel it immediately.
              dragControls.cancel();
              x.stop();
              y.stop();
              pendingTouchSwipeRef.current = null;
              return;
            }

            // If we are in the post-pinch cooldown, require a full lift before swiping.
            if (pinchCooldownRef.current) {
              return;
            }

            // Touch: delay starting drag until the finger moves a bit.
            pendingTouchSwipeRef.current = {
              pointerId: e.pointerId,
              startX: e.clientX,
              startY: e.clientY,
              eligible: true,
              started: false,
            };
            return;
          }

          if (isPinching) return;

          const target = e.target as HTMLElement;
          // Don't start swiping when interacting with actual media control elements.
          // Be specific: exclude buttons, sliders, interactive elements - NOT entire overlays.
          // .vds-controls is the actual controls bar, not the full player area.
          if (
            target.closest(
              ".vds-controls, .vds-slider, .vds-button, .vds-menu, button, a, input, textarea, select, [role='slider'], [role='button']",
            )
          ) {
            return;
          }

          // Don't start swiping when image viewer is in pan mode (zoomed in)
          if (target.closest("[data-pan-mode]")) {
            return;
          }

          // Ensure we capture the pointer for touch to work reliably
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          dragControls.start(e, { snapToCursor: false });
        }}
        initial={false}
        animate={
          isExiting
            ? {
                x: exitCoords.x,
                y: exitCoords.y,
                opacity: 0,
              }
            : {
                x: 0,
                y: 0,
                opacity: 1,
                scale: stackScale,
                translateY: stackY,
              }
        }
        onAnimationComplete={() => {
          if (isExiting) {
            onExitComplete?.();
          }
        }}
        transition={
          isExiting ? { duration: 0.2 } : { duration: 0.25, ease: "easeOut" }
        }
      >
        {/* Card content */}
        <div className="relative h-full w-full overflow-hidden">
          {children}

          {/* Intent overlays - show on top card during drag, or locked during exit */}
          {(isTop || isExiting) && (
            <>
              {/* Trash overlay (left) */}
              <IntentOverlay
                opacity={
                  isExiting && exitDirection === "left" ? 1 : trashOpacity
                }
                className="bg-destructive/80"
              >
                <div className="flex flex-col items-center gap-2 text-white">
                  <IconTrash aria-hidden="true" className="size-16" />
                  <span className="text-lg font-semibold">Trash</span>
                </div>
              </IntentOverlay>

              {/* Archive overlay (right) */}
              <IntentOverlay
                opacity={
                  isExiting && exitDirection === "right" ? 1 : archiveOpacity
                }
                className="bg-primary/80"
              >
                <div className="text-primary-foreground flex flex-col items-center gap-2">
                  <IconArchive aria-hidden="true" className="size-16" />
                  <span className="text-lg font-semibold">Archive</span>
                </div>
              </IntentOverlay>

              {/* Skip overlay (up) */}
              <IntentOverlay
                opacity={isExiting && exitDirection === "up" ? 1 : skipOpacity}
                className="bg-muted/80"
              >
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <IconArrowUp aria-hidden="true" className="size-16" />
                  <span className="text-lg font-semibold">Skip</span>
                </div>
              </IntentOverlay>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
});

/** Intent overlay component */
function IntentOverlay({
  opacity,
  className,
  children,
}: {
  opacity: MotionValue<number> | number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        className,
      )}
      style={{ opacity } as React.CSSProperties}
    >
      {children}
    </motion.div>
  );
}
