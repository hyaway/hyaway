// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
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
  const [localValue, setLocalValue] = useState<boolean | null>(value);

  // Sync when the external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: boolean | null) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const isLiked = localValue === true;
  const isDisliked = localValue === false;
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
        className="size-10 p-0"
        onClick={() => handleChange(isLiked ? null : true)}
        disabled={disabled}
        aria-label={isLiked ? "Remove like" : "Like"}
        aria-pressed={isLiked}
      >
        {isLiked ? (
          <FilledIcon
            aria-hidden
            className={cn(
              "size-7 text-emerald-500 transition-transform",
              shapeClassName,
              !disabled && "pointer-hover:[button:hover_&]:scale-125",
            )}
          />
        ) : (
          <OutlineIcon
            aria-hidden
            className={cn(
              "size-7 transition-transform",
              shapeClassName,
              !disabled &&
                "pointer-hover:[button:hover_&]:scale-125 pointer-hover:[button:hover_&]:text-emerald-500",
            )}
          />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="size-10 p-0"
        onClick={() => handleChange(isDisliked ? null : false)}
        disabled={disabled}
        aria-label={isDisliked ? "Remove dislike" : "Dislike"}
        aria-pressed={isDisliked}
      >
        <span
          className={cn(
            "relative transition-transform",
            !disabled && "pointer-hover:[button:hover_&]:scale-125",
          )}
        >
          {isDisliked ? (
            <FilledIcon
              aria-hidden
              className={cn("text-destructive size-7", shapeClassName)}
            />
          ) : (
            <OutlineIcon
              aria-hidden
              className={cn(
                "size-7",
                shapeClassName,
                !disabled && "pointer-hover:[button:hover_&]:text-destructive",
              )}
            />
          )}
          <IconBackslash
            aria-hidden
            className="text-background pointer-events-none absolute -inset-2.5 size-12"
            strokeWidth={3}
          />
          <IconBackslash
            aria-hidden
            className={cn(
              "pointer-events-none absolute -inset-2.5 size-12",
              isDisliked
                ? "text-destructive"
                : "pointer-hover:[button:hover_&]:text-destructive",
            )}
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
  const [localValue, setLocalValue] = useState<number | null>(value);

  // Sync when the external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: number | null) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);
  const {
    filled: FilledIcon,
    outline: OutlineIcon,
    className: shapeClassName,
  } = useShapeIcons(serviceKey, starShape);

  const isZero = localValue === 0;
  const canSetZero = minStars === 0;

  const columns = Math.min(
    maxStars > 10 ? Math.ceil(maxStars / 2) : maxStars,
    10,
  );

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label={`Rating: ${localValue === null ? "no rating" : `${localValue} of ${maxStars}`}`}
    >
      {/* Zero star - outside grid, doesn't participate in reflow */}
      {canSetZero && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex h-auto flex-col gap-0.5 px-1.5 py-1",
            isZero && "text-destructive disabled:opacity-100",
            !disabled && !isZero && "pointer-hover:hover:text-destructive",
          )}
          onClick={() => handleChange(localValue === 0 ? null : 0)}
          disabled={disabled}
          aria-label={
            isZero ? "Clear rating (was 0)" : `Set rating to 0 of ${maxStars}`
          }
        >
          {isZero ? (
            <IconCircleDashedNumber0
              aria-hidden
              className="pointer-hover:[button:hover_&]:scale-125 size-7 transition-transform"
            />
          ) : (
            <IconCircleDashed
              aria-hidden
              className="pointer-hover:[button:hover_&]:scale-125 size-7 transition-transform"
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
          const isFilled = localValue !== null && star <= localValue;
          // Stars 1+ are always clickable when minStars is 0 or 1
          const isClickable = star >= minStars;

          return (
            <Button
              key={star}
              variant="ghost"
              size="sm"
              className={cn(
                "flex h-auto flex-col gap-0.5 px-1.5 py-1",
                !isFilled && isZero && "text-muted-foreground/50",
                !isClickable && "cursor-not-allowed opacity-30",
              )}
              onClick={() => {
                // Clicking the currently selected star clears the rating
                handleChange(localValue === star ? null : star);
              }}
              disabled={disabled || !isClickable}
              aria-label={
                !isClickable
                  ? `${star} of ${maxStars} (disabled)`
                  : localValue === star
                    ? `Clear rating (was ${star} of ${maxStars})`
                    : `Set rating to ${star} of ${maxStars}`
              }
            >
              {isFilled ? (
                <FilledIcon
                  aria-hidden
                  className={cn(
                    "size-7 text-amber-500 transition-transform",
                    shapeClassName,
                    !disabled && "pointer-hover:[button:hover_&]:scale-125",
                    // Dim filled stars that come after hovered star (pointer devices only)
                    !disabled &&
                      "pointer-hover:[button:hover~button_&]:opacity-40",
                  )}
                />
              ) : (
                <OutlineIcon
                  aria-hidden
                  className={cn(
                    "size-7 transition-transform",
                    shapeClassName,
                    isClickable &&
                      !disabled &&
                      "pointer-hover:[button:hover_&]:scale-125 pointer-hover:[button:hover_&]:text-amber-500",
                    // Also highlight preceding stars on hover (pointer devices only)
                    isClickable &&
                      !disabled &&
                      "pointer-hover:[button:has(~button:hover)_&]:text-amber-500",
                  )}
                />
              )}
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
