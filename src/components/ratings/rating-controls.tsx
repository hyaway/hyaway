// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconBackslash,
  IconCircleDashed,
  IconCircleDashedNumber0,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";
import { useShapeIcons } from "./use-shape-icons";
import type { RatingValue } from "@/integrations/hydrus-api/models";
import { Button } from "@/components/ui-primitives/button";
import { cn } from "@/lib/utils";

// ============================================================================
// Like/Dislike Control
// ============================================================================

interface LikeDislikeControlProps {
  value: boolean | null;
  serviceKey: string;
  starShape?: string;
  onChange: (value: boolean | null) => void;
  disabled?: boolean;
}

export function LikeDislikeControl({
  value,
  serviceKey,
  starShape,
  onChange,
  disabled,
}: LikeDislikeControlProps) {
  const isLiked = value === true;
  const isDisliked = value === false;
  const {
    filled: FilledIcon,
    outline: OutlineIcon,
    className: shapeClassName,
  } = useShapeIcons(serviceKey, starShape);

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={`Rating: ${isLiked ? "liked" : isDisliked ? "disliked" : "no rating"}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "size-10 p-0",
          isLiked && "text-emerald-500 disabled:opacity-100",
          !disabled && "hover:text-emerald-500",
        )}
        onClick={() => onChange(isLiked ? null : true)}
        disabled={disabled}
        aria-label={isLiked ? "Remove like" : "Like"}
      >
        {/* Show both icons, toggle visibility with CSS on hover */}
        <FilledIcon
          aria-hidden
          className={cn(
            "size-7 transition-transform",
            shapeClassName,
            isLiked ? "block" : "hidden",
            // Show filled on hover
            !disabled && "[button:hover_&]:block [button:hover_&]:scale-125",
          )}
        />
        <OutlineIcon
          aria-hidden
          className={cn(
            "size-7 transition-transform",
            shapeClassName,
            isLiked ? "hidden" : "block",
            // Hide outline on hover, scale up when visible
            !disabled && "[button:hover_&]:hidden",
            !isLiked && !disabled && "[button:hover_&]:scale-125",
          )}
        />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "size-10 p-0",
          isDisliked && "text-destructive disabled:opacity-100",
          !disabled && "hover:text-destructive",
        )}
        onClick={() => onChange(isDisliked ? null : false)}
        disabled={disabled}
        aria-label={isDisliked ? "Remove dislike" : "Dislike"}
      >
        {/* Show both icons with overlay, toggle visibility with CSS on hover */}
        <span
          className={cn(
            "relative transition-transform",
            !disabled && "[button:hover_&]:scale-125",
          )}
        >
          <FilledIcon
            aria-hidden
            className={cn(
              "size-7",
              shapeClassName,
              isDisliked ? "block" : "hidden",
              // Show filled on hover
              !disabled && "[button:hover_&]:block",
            )}
          />
          <OutlineIcon
            aria-hidden
            className={cn(
              "size-7",
              shapeClassName,
              isDisliked ? "hidden" : "block",
              // Hide outline on hover
              !disabled && "[button:hover_&]:hidden",
            )}
          />
          <IconBackslash
            aria-hidden
            className="text-background pointer-events-none absolute -inset-2.5 size-12"
            strokeWidth={3}
          />
          <IconBackslash
            aria-hidden
            className="pointer-events-none absolute -inset-2.5 size-12"
            strokeWidth={1.5}
          />
        </span>
      </Button>
    </div>
  );
}

// ============================================================================
// Numerical/Stars Rating Control
// ============================================================================

interface NumericalRatingControlProps {
  value: number | null;
  minStars: number;
  maxStars: number;
  serviceKey: string;
  starShape?: string;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

export function NumericalRatingControl({
  value,
  minStars,
  maxStars,
  serviceKey,
  starShape,
  onChange,
  disabled,
}: NumericalRatingControlProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);
  const {
    filled: FilledIcon,
    outline: OutlineIcon,
    className: shapeClassName,
  } = useShapeIcons(serviceKey, starShape);

  const isZero = value === 0;
  const canSetZero = minStars === 0;

  const columns = Math.min(
    maxStars > 10 ? Math.ceil(maxStars / 2) : maxStars,
    10,
  );

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label={`Rating: ${value === null ? "no rating" : `${value} of ${maxStars}`}`}
    >
      {/* Zero star - outside grid, doesn't participate in reflow */}
      {canSetZero && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex h-auto flex-col gap-0.5 px-1.5 py-1",
            isZero && "text-destructive disabled:opacity-100",
            !disabled && !isZero && "hover:text-destructive",
          )}
          onClick={() => onChange(value === 0 ? null : 0)}
          disabled={disabled}
          aria-label="0 stars"
        >
          {isZero ? (
            <IconCircleDashedNumber0
              aria-hidden
              className="size-7 transition-transform [button:hover_&]:scale-125"
            />
          ) : (
            <IconCircleDashed
              aria-hidden
              className="size-7 transition-transform [button:hover_&]:scale-125"
            />
          )}
          <span
            className="text-muted-foreground text-xs tabular-nums"
            aria-hidden
          >
            0
          </span>
        </Button>
      )}
      <div
        className="group/stars grid"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {stars.map((star) => {
          const isFilled = value !== null && star <= value;
          // Stars 1+ are always clickable when minStars is 0 or 1
          const isClickable = star >= minStars;

          return (
            <Button
              key={star}
              variant="ghost"
              size="sm"
              className={cn(
                "flex h-auto flex-col gap-0.5 px-1.5 py-1",
                // Base filled state
                isFilled && "text-amber-500 disabled:opacity-100",
                !isFilled && isZero && "text-muted-foreground/50",
                !isClickable && "cursor-not-allowed opacity-30",
                // CSS hover: highlight this and all previous stars
                isClickable &&
                  !disabled &&
                  "[&:has(~button:hover)]:text-amber-500 [&:hover]:text-amber-500",
              )}
              onClick={() => {
                if (!isClickable) return;
                // Clicking the currently selected star clears the rating
                onChange(value === star ? null : star);
              }}
              disabled={disabled || !isClickable}
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            >
              {/* Show both icons, toggle visibility with CSS on hover */}
              <FilledIcon
                aria-hidden
                className={cn(
                  "size-7 transition-transform",
                  shapeClassName,
                  isFilled ? "block" : "hidden",
                  // Show filled on hover
                  isClickable &&
                    !disabled &&
                    "[button:has(~button:hover)_&]:block [button:hover_&]:block [button:hover_&]:scale-125",
                  // Dim filled stars that come after hovered star
                  isFilled && !disabled && "[button:hover~button_&]:opacity-40",
                )}
              />
              <OutlineIcon
                aria-hidden
                className={cn(
                  "size-7 transition-transform",
                  shapeClassName,
                  isFilled ? "hidden" : "block",
                  // Hide outline on hover
                  isClickable &&
                    !disabled &&
                    "[button:has(~button:hover)_&]:hidden [button:hover_&]:hidden",
                  // Scale up on direct hover (when not filled)
                  !isFilled &&
                    isClickable &&
                    !disabled &&
                    "[button:hover_&]:scale-125",
                )}
              />
              <span
                className="text-muted-foreground text-xs tabular-nums"
                aria-hidden
              >
                {star}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Inc/Dec Rating Control
// ============================================================================

interface IncDecRatingControlProps {
  value: number;
  onChange: (value: RatingValue) => void;
  disabled?: boolean;
}

export function IncDecRatingControl({
  value,
  onChange,
  disabled,
}: IncDecRatingControlProps) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label={`Rating: ${value}`}
    >
      <Button
        variant="outline"
        size="sm"
        className="size-9.5 p-0"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
        aria-label="Decrease"
      >
        <IconMinus aria-hidden className="size-6" />
      </Button>
      <span
        className="bg-muted min-w-10 rounded border px-2 py-1.5 text-center text-base tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="size-9.5 p-0"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label="Increase"
      >
        <IconPlus aria-hidden className="size-6" />
      </Button>
    </div>
  );
}
