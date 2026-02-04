// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
import {
  IconBackslash,
  IconChevronDown,
  IconCircleDashed,
  IconCircleDashedNumber0,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";
import { useShapeIcons } from "./use-shape-icons";
import {
  DEFAULT_DISLIKE_COLORS,
  DEFAULT_LIKE_COLORS,
  DEFAULT_NUMERICAL_FILLED,
} from "./rating-colors";
import type {
  RatingColor,
  RatingValue,
  StarShape,
} from "@/integrations/hydrus-api/models";
import { Button } from "@/components/ui-primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { cn } from "@/lib/utils";

/** Threshold for switching from star grid to dropdown in compact mode */
const COMPACT_DROPDOWN_THRESHOLD = 6;

// ============================================================================
// Like/Dislike Control
// ============================================================================

interface LikeDislikeControlProps {
  value: boolean | null;
  serviceKey: string;
  starShape: StarShape;
  onChange: (value: boolean | null) => void;
  disabled?: boolean;
  /** Compact mode with smaller buttons */
  compact?: boolean;
  /** Custom like colors from service */
  likeColors?: RatingColor;
  /** Custom dislike colors from service */
  dislikeColors?: RatingColor;
}

export function LikeDislikeControl({
  value,
  serviceKey,
  starShape,
  onChange,
  disabled,
  compact,
  likeColors = DEFAULT_LIKE_COLORS,
  dislikeColors = DEFAULT_DISLIKE_COLORS,
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

  const buttonSize = compact ? "size-8" : "size-10";
  const iconSize = compact ? "size-5" : "size-7";
  const slashInset = compact ? "-inset-1.5" : "-inset-2.5";
  const slashSize = compact ? "size-8" : "size-12";

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={`Rating: ${isLiked ? "liked" : isDisliked ? "disliked" : "no rating"}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonSize, "p-0")}
        onClick={() => handleChange(isLiked ? null : true)}
        disabled={disabled}
        aria-label={isLiked ? "Remove like" : "Like"}
        aria-pressed={isLiked}
      >
        {isLiked ? (
          <FilledIcon
            aria-hidden
            className={cn(
              iconSize,
              "transition-transform",
              shapeClassName,
              !disabled && "pointer-hover:[button:hover_&]:scale-125",
            )}
            style={{ color: likeColors.brush, stroke: likeColors.pen }}
          />
        ) : (
          <OutlineIcon
            aria-hidden
            className={cn(
              iconSize,
              "transition-transform",
              shapeClassName,
              !disabled &&
                "pointer-hover:[button:hover_&]:scale-125 pointer-hover:[button:hover_&]:opacity-100",
            )}
            style={
              !disabled
                ? ({
                    "--hover-color": likeColors.brush,
                    "--hover-stroke": likeColors.pen,
                  } as React.CSSProperties)
                : undefined
            }
          />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonSize, "p-0")}
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
          style={
            isDisliked
              ? { color: dislikeColors.brush, stroke: dislikeColors.pen }
              : undefined
          }
        >
          {isDisliked ? (
            <FilledIcon aria-hidden className={cn(iconSize, shapeClassName)} />
          ) : (
            <OutlineIcon
              aria-hidden
              className={cn(
                iconSize,
                shapeClassName,
                !disabled && "pointer-hover:[button:hover_&]:opacity-100",
              )}
            />
          )}
          <IconBackslash
            aria-hidden
            className={cn(
              "text-background pointer-events-none absolute",
              slashInset,
              slashSize,
            )}
            strokeWidth={3}
          />
          <IconBackslash
            aria-hidden
            className={cn(
              "pointer-events-none absolute",
              slashInset,
              slashSize,
            )}
            style={{ color: dislikeColors.brush }}
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
  starShape: StarShape;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  /** Compact mode: hides number labels, uses dropdown for high star counts */
  compact?: boolean;
  /**
   * Custom filled star colors from service.
   * @default DEFAULT_NUMERICAL_FILLED
   */
  filledColors?: RatingColor;
}

export function NumericalRatingControl({
  value,
  minStars,
  maxStars,
  serviceKey,
  starShape,
  onChange,
  disabled,
  compact,
  filledColors = DEFAULT_NUMERICAL_FILLED,
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

  const {
    filled: FilledIcon,
    outline: OutlineIcon,
    className: shapeClassName,
  } = useShapeIcons(serviceKey, starShape);

  // Use dropdown for high star counts in compact mode
  if (compact && maxStars >= COMPACT_DROPDOWN_THRESHOLD) {
    return (
      <NumericalRatingDropdown
        value={localValue}
        minStars={minStars}
        maxStars={maxStars}
        onChange={handleChange}
        disabled={disabled}
        FilledIcon={FilledIcon}
        OutlineIcon={OutlineIcon}
        shapeClassName={shapeClassName}
        filledColors={filledColors}
      />
    );
  }

  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);
  const isZero = localValue === 0;
  const canSetZero = minStars === 0;

  const iconSize = "size-7";

  // In compact mode, include zero in the grid; otherwise keep it outside
  const gridColumns = compact && canSetZero ? maxStars + 1 : maxStars;
  const effectiveColumns = compact
    ? gridColumns
    : Math.min(gridColumns > 10 ? Math.ceil(gridColumns / 2) : gridColumns, 10);

  return (
    <div
      className={cn("flex items-center", !compact && "flex-wrap gap-2")}
      role="group"
      aria-label={`Rating: ${localValue === null ? "no rating" : `${localValue} of ${maxStars}`}`}
    >
      {/* Zero star - outside grid in non-compact mode */}
      {canSetZero && !compact && (
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
              className={cn(
                "pointer-hover:[button:hover_&]:scale-125 transition-transform",
                iconSize,
              )}
            />
          ) : (
            <IconCircleDashed
              aria-hidden
              className={cn(
                "pointer-hover:[button:hover_&]:scale-125 transition-transform",
                iconSize,
              )}
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
        style={{
          gridTemplateColumns: `repeat(${effectiveColumns}, minmax(${compact ? "2.75rem" : "0"}, 1fr))`,
        }}
      >
        {/* Zero star - inside grid in compact mode */}
        {canSetZero && compact && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex h-auto min-h-11 min-w-11 items-center justify-center p-1",
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
                className={cn(
                  "pointer-hover:[button:hover_&]:scale-125 transition-transform",
                  iconSize,
                )}
              />
            ) : (
              <IconCircleDashed
                aria-hidden
                className={cn(
                  "pointer-hover:[button:hover_&]:scale-125 transition-transform",
                  iconSize,
                )}
              />
            )}
          </Button>
        )}
        {stars.map((star) => {
          const isFilled = localValue !== null && star <= localValue;
          // Stars 1+ are always clickable when minStars is 0 or 1
          const isClickable = star >= minStars;
          const isDisabled = disabled || !isClickable;

          return (
            <Button
              key={star}
              variant="ghost"
              size="sm"
              className={cn(
                "flex h-auto flex-col gap-0.5",
                compact
                  ? "min-h-11 min-w-11 items-center justify-center p-1"
                  : "px-1.5 py-1",
                !isFilled && isZero && "text-muted-foreground/50",
                !isClickable && "cursor-not-allowed opacity-30",
              )}
              onClick={() => {
                // Clicking the currently selected star clears the rating
                handleChange(localValue === star ? null : star);
              }}
              disabled={isDisabled}
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
                    iconSize,
                    "transition-transform",
                    shapeClassName,
                    !disabled && "pointer-hover:[button:hover_&]:scale-125",
                    // Dim filled stars that come after hovered star (pointer devices only)
                    !disabled &&
                      "pointer-hover:[button:hover~button_&]:opacity-40",
                  )}
                  style={{
                    color: filledColors.brush,
                    stroke: filledColors.pen,
                  }}
                />
              ) : (
                <OutlineIcon
                  aria-hidden
                  className={cn(
                    iconSize,
                    "transition-transform",
                    shapeClassName,
                    isClickable &&
                      !disabled &&
                      "pointer-hover:[button:hover_&]:scale-125 pointer-hover:[button:hover_&]:opacity-100",
                    // Also highlight preceding stars on hover (pointer devices only)
                    isClickable &&
                      !disabled &&
                      "pointer-hover:[button:has(~button:hover)_&]:opacity-100",
                  )}
                  style={
                    isClickable && !disabled
                      ? ({
                          "--hover-color": filledColors.brush,
                          "--hover-stroke": filledColors.pen,
                        } as React.CSSProperties)
                      : undefined
                  }
                />
              )}
              {!compact && (
                <span
                  className="text-muted-foreground text-xs tabular-nums"
                  aria-hidden
                >
                  {star}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Dropdown variant for high star counts
// ----------------------------------------------------------------------------

interface NumericalRatingDropdownProps {
  value: number | null;
  minStars: number;
  maxStars: number;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  FilledIcon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  OutlineIcon: React.ComponentType<{ className?: string }>;
  shapeClassName?: string;
  filledColors?: RatingColor;
}

function NumericalRatingDropdown({
  value,
  minStars,
  maxStars,
  onChange,
  disabled,
  FilledIcon,
  OutlineIcon,
  shapeClassName,
  filledColors = DEFAULT_NUMERICAL_FILLED,
}: NumericalRatingDropdownProps) {
  const [open, setOpen] = useState(false);
  const canSetZero = minStars === 0;
  const hasValue = value !== null;

  const handleValueChange = (newValue: string) => {
    if (newValue === "null") {
      onChange(null);
    } else {
      onChange(Number(newValue));
    }
    setOpen(false);
  };

  const displayValue = value === null ? "—" : String(value);
  const radioValue = value === null ? "null" : String(value);

  const renderRatingItem = (num: number) => (
    <DropdownMenuRadioItem key={num} value={String(num)} className="py-2">
      {value !== null && num <= value ? (
        <FilledIcon
          className={cn("size-4", shapeClassName)}
          style={{ color: filledColors.brush, stroke: filledColors.pen }}
        />
      ) : (
        <OutlineIcon className={cn("size-4", shapeClassName)} />
      )}
      {num}
    </DropdownMenuRadioItem>
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          "border-input bg-background ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm shadow-xs outline-1 -outline-offset-1 transition-[color,box-shadow] focus-visible:ring-4",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        {value === 0 ? (
          <IconCircleDashedNumber0 className="text-destructive size-5" />
        ) : hasValue ? (
          <FilledIcon
            className={cn("size-5", shapeClassName)}
            style={{ color: filledColors.brush, stroke: filledColors.pen }}
          />
        ) : (
          <OutlineIcon className={cn("size-5", shapeClassName)} />
        )}
        <span className="min-w-4 tabular-nums">{displayValue}</span>
        <span className="text-muted-foreground">/ {maxStars}</span>
        <IconChevronDown className="text-muted-foreground size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="right"
        className="max-h-64 min-w-32 overflow-y-auto"
      >
        <DropdownMenuRadioGroup
          value={radioValue}
          onValueChange={handleValueChange}
        >
          {Array.from(
            { length: maxStars - Math.max(1, minStars) + 1 },
            (_, i) => maxStars - i,
          ).map(renderRatingItem)}
          {canSetZero && (
            <DropdownMenuRadioItem value="0" className="py-2">
              {value === 0 ? (
                <IconCircleDashedNumber0 className="text-destructive size-4" />
              ) : (
                <IconCircleDashed className="size-4" />
              )}
              0
            </DropdownMenuRadioItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem value="null" className="py-2">
            <OutlineIcon className={cn("size-4 shrink-0", shapeClassName)} />—
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Inc/Dec Rating Control
// ============================================================================

interface IncDecRatingControlProps {
  value: number;
  onChange: (value: RatingValue) => void;
  disabled?: boolean;
  /** Compact mode with smaller buttons */
  compact?: boolean;
}

export function IncDecRatingControl({
  value,
  onChange,
  disabled,
  compact,
}: IncDecRatingControlProps) {
  const buttonSize = compact ? "size-7" : "size-9.5";
  const iconSize = compact ? "size-4" : "size-6";

  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label={`Rating: ${value}`}
    >
      <Button
        variant="outline"
        size="sm"
        className={cn(buttonSize, "p-0")}
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
        aria-label="Decrease"
      >
        <IconMinus aria-hidden className={iconSize} />
      </Button>
      <span
        className={cn(
          "bg-muted rounded border text-center tabular-nums",
          compact
            ? "min-w-8 px-1.5 py-1 text-sm"
            : "min-w-10 px-2 py-1.5 text-base",
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>
      <Button
        variant="outline"
        size="sm"
        className={cn(buttonSize, "p-0")}
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label="Increase"
      >
        <IconPlus aria-hidden className={iconSize} />
      </Button>
    </div>
  );
}
