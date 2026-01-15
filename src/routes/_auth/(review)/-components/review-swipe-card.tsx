import { memo, useRef, useState } from "react";
import { IconArchive, IconArrowUp, IconTrash } from "@tabler/icons-react";
import {
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from "motion/react";
import type { MotionValue, PanInfo } from "motion/react";
import type { ReviewAction } from "@/stores/review-queue-store";
import { cn } from "@/lib/utils";

/** Threshold in pixels for horizontal swipe (archive/trash) */
const HORIZONTAL_THRESHOLD = 90;
/** Threshold in pixels for vertical swipe (skip) - lower = easier to trigger */
const VERTICAL_THRESHOLD = 80;
/** Distance before overlay starts appearing (as fraction of threshold) */
const OVERLAY_START = 0.4;
/** Vertical overlay starts later and ramps faster (higher = later start) */
const VERTICAL_OVERLAY_START = 0.6;
/** Max rotation angle in degrees */
const MAX_ROTATION = 12;
/** Debug mode - shows colored zone overlays (set VITE_DEBUG_SWIPE_ZONES=true) */
const DEBUG_ZONES = import.meta.env.VITE_DEBUG_SWIPE_ZONES === "true";

export type SwipeDirection = "left" | "right" | "up" | "down" | null;

/** Swipe zone detection result */
type SwipeZone = "skip" | "trash" | "archive" | null;

/**
 * Determine which swipe zone we're in based on coordinates.
 * Skip (up) takes priority, then horizontal actions apply.
 */
function getSwipeZone(xVal: number, yVal: number): SwipeZone {
  // Skip takes priority when swiping up past threshold
  if (yVal < -VERTICAL_THRESHOLD) return "skip";
  // Horizontal zones
  if (xVal < -HORIZONTAL_THRESHOLD) return "trash";
  if (xVal > HORIZONTAL_THRESHOLD) return "archive";
  return null;
}

/** Calculate overlay opacity for a zone based on progress toward threshold */
function getZoneOpacity(
  xVal: number,
  yVal: number,
  zone: "skip" | "trash" | "archive",
): number {
  const horizontalStart = HORIZONTAL_THRESHOLD * OVERLAY_START;
  const verticalStart = VERTICAL_THRESHOLD * VERTICAL_OVERLAY_START;

  // Determine which zone is currently "active" based on which threshold we're closer to
  // Skip zone wins when: past skip threshold OR (approaching skip AND vertical > horizontal progress)
  const inSkipZone = yVal < -VERTICAL_THRESHOLD;
  const skipProgress =
    yVal >= -verticalStart
      ? 0
      : (-yVal - verticalStart) / (VERTICAL_THRESHOLD - verticalStart);

  const horizontalProgress =
    xVal >= -horizontalStart && xVal <= horizontalStart
      ? 0
      : xVal < 0
        ? (-xVal - horizontalStart) / (HORIZONTAL_THRESHOLD - horizontalStart)
        : (xVal - horizontalStart) / (HORIZONTAL_THRESHOLD - horizontalStart);

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

export interface ReviewSwipeCardProps {
  /** The file ID being displayed */
  fileId: number;
  /** Whether this is the top card (interactive) */
  isTop: boolean;
  /** Stack position (0 = top, 1 = second, etc.) */
  stackIndex: number;
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

  // Calculate rotation based on horizontal drag
  const rotate = useTransform(
    x,
    [-200, 0, 200],
    [-MAX_ROTATION, 0, MAX_ROTATION],
  );

  // Calculate opacity for intent overlays using shared zone logic
  const trashOpacity = useTransform(x, (xVal) =>
    getZoneOpacity(xVal, y.get(), "trash"),
  );
  const archiveOpacity = useTransform(x, (xVal) =>
    getZoneOpacity(xVal, y.get(), "archive"),
  );
  const skipOpacity = useTransform(y, (yVal) =>
    getZoneOpacity(x.get(), yVal, "skip"),
  );

  // Scale for stacked cards (cards behind are slightly smaller)
  const stackScale = 1 - stackIndex * 0.05;
  const stackY = stackIndex * 8;

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const { offset } = info;
    const zone = getSwipeZone(offset.x, offset.y);

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
      {/* Debug zone visualization - shows threshold lines from center */}

      {DEBUG_ZONES && isTop && (
        <div className="pointer-events-none absolute inset-0 z-50">
          {/* Center crosshair - moves with card */}
          <motion.div
            className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-500 bg-yellow-500/20"
            style={{ x, y }}
          />
          {/* Trash threshold line (left of center) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500"
            style={{ left: `calc(50% - ${HORIZONTAL_THRESHOLD}px)` }}
          >
            <span className="absolute top-4 left-2 text-xs font-bold whitespace-nowrap text-red-500">
              ← TRASH
            </span>
          </div>
          {/* Archive threshold line (right of center) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-green-500"
            style={{ left: `calc(50% + ${HORIZONTAL_THRESHOLD}px)` }}
          >
            <span className="absolute top-4 right-2 text-xs font-bold whitespace-nowrap text-green-500">
              ARCHIVE →
            </span>
          </div>
          {/* Skip threshold line (above center) */}
          <div
            className="absolute right-0 left-0 h-0.5 bg-blue-500"
            style={{ top: `calc(50% - ${VERTICAL_THRESHOLD}px)` }}
          >
            <span className="absolute bottom-2 left-4 text-xs font-bold whitespace-nowrap text-blue-500">
              ↑ SKIP
            </span>
          </div>
        </div>
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
        onTouchStart={(e) => {
          if (e.touches.length >= 2) {
            setIsPinching(true);
            x.stop();
            y.stop();
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length >= 2 && !isPinching) {
            setIsPinching(true);
          }
        }}
        onTouchEnd={(e) => {
          if (e.touches.length < 2 && isPinching) {
            setIsPinching(false);
          }
        }}
        onTouchCancel={() => {
          if (isPinching) {
            setIsPinching(false);
          }
        }}
        onPointerDown={(e) => {
          if (!isTop || isExiting || !gesturesEnabled) return;
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

          // Ensure we capture the pointer for touch to work reliably
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
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
                  <IconTrash className="size-16" />
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
                  <IconArchive className="size-16" />
                  <span className="text-lg font-semibold">Archive</span>
                </div>
              </IntentOverlay>

              {/* Skip overlay (up) */}
              <IntentOverlay
                opacity={isExiting && exitDirection === "up" ? 1 : skipOpacity}
                className="bg-muted/80"
              >
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <IconArrowUp className="size-16" />
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
