// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useRef, useState } from "react";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from "motion/react";
import { getSwipeBindingOverlayDescriptor } from "./review-swipe-descriptors";
import { ReviewThresholdOverlay } from "./review-threshold-overlay";
import type { MotionValue, PanInfo } from "motion/react";
import type {
  SwipeBindings,
  SwipeDirection,
  SwipeThresholds,
} from "@/stores/review-settings-store";
import {
  SWIPE_DIRECTIONS,
  useReviewShowGestureThresholds,
  useReviewSwipeThresholds,
} from "@/stores/review-settings-store";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { cn } from "@/lib/utils";

// Re-export SwipeDirection for consumers that import from this file
export type { SwipeDirection } from "@/stores/review-settings-store";

/** Distance before overlay starts appearing (as fraction of threshold) */
const OVERLAY_START = 0.4;
/** Vertical overlay starts later and ramps faster (higher = later start) */
const VERTICAL_OVERLAY_START = 0.6;
/** Max rotation angle in degrees */
const MAX_ROTATION = 12;
/** Touch movement (px) before we start a swipe drag */
const TOUCH_SWIPE_START_DISTANCE = 6;
/** Drag elasticity - how much the card follows the finger (0-1) */
const DRAG_ELASTIC = 0.9;

/**
 * CSS selector for interactive elements that should block swipe initiation.
 * Covers media player controls (vidstack), standard form elements, and ARIA roles.
 */
const INTERACTIVE_ELEMENT_SELECTOR =
  ".vds-controls, .vds-slider, .vds-button, .vds-menu, button, a, input, textarea, select, [role='slider'], [role='button']";

/**
 * Determine which swipe direction we're in based on coordinates.
 * Zone boundaries are diagonal lines from threshold corners to image corners.
 * Returns null if no threshold is crossed.
 */
function getSwipeDirection(
  xVal: number,
  yVal: number,
  thresholds: SwipeThresholds,
  cardSize: CardSize,
): SwipeDirection | null {
  if (cardSize.width <= 0 || cardSize.height <= 0) return null;

  const absX = Math.abs(xVal);
  const absY = Math.abs(yVal);

  // Get thresholds based on which direction the point is in
  const horizontalThresholdPercent =
    xVal < 0 ? thresholds.left : thresholds.right;
  const verticalThresholdPercent = yVal < 0 ? thresholds.up : thresholds.down;

  const halfW = cardSize.width / 2;
  const halfH = cardSize.height / 2;
  const horizontalThreshold =
    (cardSize.width * horizontalThresholdPercent) / 100;
  const verticalThreshold = (cardSize.height * verticalThresholdPercent) / 100;

  // Check if we've crossed any threshold
  const crossedHorizontal = absX >= horizontalThreshold;
  const crossedVertical = absY >= verticalThreshold;

  if (!crossedHorizontal && !crossedVertical) return null;

  // The zone boundary is the line from threshold corner to image corner.
  // We use cross product to determine which side of this diagonal the point is on.
  // Vector from threshold corner to image corner
  const edgeX = halfW - horizontalThreshold;
  const edgeY = halfH - verticalThreshold;

  // Vector from threshold corner to current point
  const pointX = absX - horizontalThreshold;
  const pointY = absY - verticalThreshold;

  // Cross product: positive means point is above the diagonal (vertical zone)
  const cross = edgeX * pointY - edgeY * pointX;

  // If cross >= 0, we're in vertical zone; if cross < 0, we're in horizontal zone
  if (crossedVertical && (!crossedHorizontal || cross >= 0)) {
    return yVal < 0 ? "up" : "down";
  }

  // Horizontal
  if (crossedHorizontal) {
    return xVal < 0 ? "left" : "right";
  }

  return null;
}

/** Calculate overlay opacity for a direction based on progress toward threshold */
function getDirectionOpacity(
  xVal: number,
  yVal: number,
  direction: SwipeDirection,
  thresholds: SwipeThresholds,
  cardSize: CardSize,
): number {
  if (cardSize.width <= 0 || cardSize.height <= 0) return 0;

  // Get thresholds based on which direction the point is in
  const horizontalThresholdPercent =
    xVal < 0 ? thresholds.left : thresholds.right;
  const verticalThresholdPercent = yVal < 0 ? thresholds.up : thresholds.down;

  const horizontalThreshold =
    (cardSize.width * horizontalThresholdPercent) / 100;
  const verticalThreshold = (cardSize.height * verticalThresholdPercent) / 100;
  const horizontalStart = horizontalThreshold * OVERLAY_START;
  const verticalStart = verticalThreshold * VERTICAL_OVERLAY_START;

  // Calculate progress for each axis
  const absX = Math.abs(xVal);
  const absY = Math.abs(yVal);

  const horizontalRange = horizontalThreshold - horizontalStart;
  const verticalRange = verticalThreshold - verticalStart;

  const horizontalProgress =
    absX <= horizontalStart
      ? 0
      : horizontalRange <= 0
        ? 1
        : (absX - horizontalStart) / horizontalRange;

  const verticalProgress =
    absY <= verticalStart
      ? 0
      : verticalRange <= 0
        ? 1
        : (absY - verticalStart) / verticalRange;

  // Use same cross-product logic as getSwipeDirection to determine zone
  const halfW = cardSize.width / 2;
  const halfH = cardSize.height / 2;
  const edgeX = halfW - horizontalThreshold;
  const edgeY = halfH - verticalThreshold;
  const pointX = absX - horizontalThreshold;
  const pointY = absY - verticalThreshold;
  const cross = edgeX * pointY - edgeY * pointX;

  const verticalWins = cross >= 0;
  const horizontalWins = cross < 0;

  switch (direction) {
    case "up": {
      if (!verticalWins || yVal >= 0) return 0;
      return Math.min(1, verticalProgress);
    }
    case "down": {
      if (!verticalWins || yVal <= 0) return 0;
      return Math.min(1, verticalProgress);
    }
    case "left": {
      if (!horizontalWins || xVal >= 0) return 0;
      return Math.min(1, horizontalProgress);
    }
    case "right": {
      if (!horizontalWins || xVal <= 0) return 0;
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
  /** Current swipe bindings for overlay display */
  bindings: SwipeBindings;
  /** Whether undo is available (history has entries) */
  canUndo: boolean;
  /** Exit direction for animation (triggers exit when set) */
  exitDirection?: SwipeDirection | null;
  /** Whether swipe gestures are enabled */
  gesturesEnabled?: boolean;
  /** Ref controlling whether to skip transition animations */
  skipAnimationRef: React.RefObject<boolean>;
  /** Callback when swipe completes with a direction (only called if direction has a binding) */
  onSwipe: (direction: SwipeDirection) => void;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
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
  bindings,
  canUndo,
  exitDirection,
  gesturesEnabled = true,
  skipAnimationRef,
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
  const thresholds = useReviewSwipeThresholds();
  const { servicesMap } = useRatingServices();

  // Calculate rotation based on horizontal drag
  const rotate = useTransform(
    x,
    [-200, 0, 200],
    [-MAX_ROTATION, 0, MAX_ROTATION],
  );

  // Calculate opacity for intent overlays per direction
  const leftOpacity = useTransform(x, (xVal) =>
    getDirectionOpacity(xVal, y.get(), "left", thresholds, cardSize),
  );
  const rightOpacity = useTransform(x, (xVal) =>
    getDirectionOpacity(xVal, y.get(), "right", thresholds, cardSize),
  );
  const upOpacity = useTransform(y, (yVal) =>
    getDirectionOpacity(x.get(), yVal, "up", thresholds, cardSize),
  );
  const downOpacity = useTransform(y, (yVal) =>
    getDirectionOpacity(x.get(), yVal, "down", thresholds, cardSize),
  );

  // Map direction to opacity motion value
  const directionOpacities: Record<SwipeDirection, MotionValue<number>> = {
    left: leftOpacity,
    right: rightOpacity,
    up: upOpacity,
    down: downOpacity,
  };

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
    // Scale offset by drag elasticity to get the visual position
    // (the card doesn't follow the finger exactly due to elasticity)
    const visualX = offset.x * DRAG_ELASTIC;
    const visualY = offset.y * DRAG_ELASTIC;
    const direction = getSwipeDirection(visualX, visualY, thresholds, cardSize);

    // Only trigger if direction crossed threshold
    if (direction) {
      onSwipe(direction);
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
          thresholds={thresholds}
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
        dragElastic={DRAG_ELASTIC}
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
            if (target.closest(INTERACTIVE_ELEMENT_SELECTOR)) {
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
          if (target.closest(INTERACTIVE_ELEMENT_SELECTOR)) {
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
          skipAnimationRef.current
            ? { duration: 0 }
            : isExiting
              ? { duration: 0.2 }
              : { duration: 0.25, ease: "easeOut" }
        }
      >
        {/* Card content */}
        <div className="relative h-full w-full overflow-hidden">
          {children}

          {/* Intent overlays - show on top card during drag, or locked during exit */}
          {(isTop || isExiting) &&
            SWIPE_DIRECTIONS.map((direction) => {
              const binding = bindings[direction];

              const descriptor = getSwipeBindingOverlayDescriptor(
                binding,
                servicesMap,
              );
              const Icon = descriptor.icon;
              const opacity =
                isExiting && exitDirection === direction
                  ? 1
                  : directionOpacities[direction];

              // Undo-bound direction with nothing to undo: show disabled overlay
              const isDisabledUndo = binding.fileAction === "undo" && !canUndo;

              return (
                <IntentOverlay
                  key={direction}
                  opacity={opacity}
                  className={cn(
                    descriptor.bgClass,
                    isDisabledUndo && "opacity-60 grayscale",
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col items-center gap-2",
                      descriptor.textClass,
                    )}
                  >
                    <Icon aria-hidden="true" className="size-16" />
                    <span className="text-lg font-semibold">
                      {isDisabledUndo ? "Nothing to undo" : descriptor.label}
                    </span>
                  </div>
                </IntentOverlay>
              );
            })}
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
