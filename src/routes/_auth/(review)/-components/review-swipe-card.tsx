import { useRef } from "react";
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
const HORIZONTAL_THRESHOLD = 100;
/** Threshold in pixels for vertical swipe (skip) - lower = easier to trigger */
const VERTICAL_THRESHOLD = 80;
/** Distance before overlay starts appearing (as fraction of threshold) */
const OVERLAY_START = 0.4;
/** Max rotation angle in degrees */
const MAX_ROTATION = 12;
/** Debug mode - shows colored zone overlays (set VITE_DEBUG_SWIPE_ZONES=true) */
const DEBUG_ZONES = import.meta.env.VITE_DEBUG_SWIPE_ZONES === "true";

export type SwipeDirection = "left" | "right" | "up" | "down" | null;

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

export function ReviewSwipeCard({
  fileId,
  isTop,
  stackIndex,
  children,
  exitDirection,
  onSwipe,
  onExitComplete,
}: ReviewSwipeCardProps) {
  const isExiting = exitDirection != null;
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Calculate rotation based on horizontal drag
  const rotate = useTransform(
    x,
    [-200, 0, 200],
    [-MAX_ROTATION, 0, MAX_ROTATION],
  );

  // Calculate overlay start points (overlay appears later into the swipe)
  const horizontalStart = HORIZONTAL_THRESHOLD * OVERLAY_START;
  const verticalStart = VERTICAL_THRESHOLD * OVERLAY_START;

  // Calculate opacity for intent overlays - starts later and requires dominant axis
  // Skip takes priority when past threshold
  const trashOpacity = useTransform(x, (xVal) => {
    const yVal = y.get();
    // Skip zone takes priority - don't show trash if in skip zone
    if (yVal < -VERTICAL_THRESHOLD) return 0;
    // Only show if horizontal movement is dominant
    if (Math.abs(yVal) >= Math.abs(xVal)) return 0;
    if (xVal >= -horizontalStart) return 0;
    // Map from start point to threshold
    return Math.min(
      1,
      (-xVal - horizontalStart) / (HORIZONTAL_THRESHOLD - horizontalStart),
    );
  });

  const archiveOpacity = useTransform(x, (xVal) => {
    const yVal = y.get();
    // Skip zone takes priority - don't show archive if in skip zone
    if (yVal < -VERTICAL_THRESHOLD) return 0;
    if (Math.abs(yVal) >= Math.abs(xVal)) return 0;
    if (xVal <= horizontalStart) return 0;
    return Math.min(
      1,
      (xVal - horizontalStart) / (HORIZONTAL_THRESHOLD - horizontalStart),
    );
  });

  const skipOpacity = useTransform(y, (yVal) => {
    const xVal = x.get();
    // Skip takes priority when past threshold, regardless of horizontal
    if (yVal < -VERTICAL_THRESHOLD) return 1;
    // Otherwise only show if vertical movement is dominant
    if (Math.abs(xVal) > Math.abs(yVal)) return 0;
    if (yVal >= -verticalStart) return 0;
    return Math.min(
      1,
      (-yVal - verticalStart) / (VERTICAL_THRESHOLD - verticalStart),
    );
  });

  // Scale for stacked cards (cards behind are slightly smaller)
  const stackScale = 1 - stackIndex * 0.05;
  const stackY = stackIndex * 8;

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const { offset } = info;
    let direction: SwipeDirection = null;

    // Skip takes priority - if we're past skip threshold, ignore horizontal
    if (offset.y < -VERTICAL_THRESHOLD) {
      direction = "up";
    } else if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal swipe (only if not in skip zone)
      if (offset.x < -HORIZONTAL_THRESHOLD) {
        direction = "left";
      } else if (offset.x > HORIZONTAL_THRESHOLD) {
        direction = "right";
      }
    }

    if (direction) {
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
    <div ref={constraintsRef} className="absolute inset-0" style={{ zIndex }}>
      {/* Debug zone visualization - shows threshold lines from center */}

      {DEBUG_ZONES && isTop && (
        <div className="pointer-events-none absolute inset-0 z-50">
          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-500 bg-yellow-500/20" />
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
          isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
        )}
        style={{
          x,
          y,
          rotate,
          scale: stackScale,
          translateY: stackY,
        }}
        drag={isTop && !isExiting}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
        onPointerDown={(e) => {
          if (!isTop || isExiting) return;

          const target = e.target as HTMLElement;
          // Don't start swiping when interacting with media controls (Vidstack)
          // or standard interactive elements.
          if (
            target.closest(
              "[data-media-controls], .vds-slider, button, a, input, textarea, select, [role='slider']",
            )
          ) {
            return;
          }

          // Ensure we capture the pointer for touch to work reliably
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
}

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
