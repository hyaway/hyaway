// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
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
  getIncDecPositiveColors,
} from "./rating-colors";
import type {
  RatingColor,
  RatingServiceInfo,
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
import { getThemeAdjustedColorFromHex } from "@/lib/color-utils";
import { useActiveTheme } from "@/stores/theme-store";

/** Rating control size variant */
export type RatingControlSize = "default" | "compact";

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
  /** Size variant for the control */
  size?: RatingControlSize;
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
  size = "default",
  likeColors = DEFAULT_LIKE_COLORS,
  dislikeColors = DEFAULT_DISLIKE_COLORS,
}: LikeDislikeControlProps) {
  const compact = size === "compact";
  const isLiked = value === true;
  const isDisliked = value === false;
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
        onClick={() => onChange(isLiked ? null : true)}
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
            strokeWidth={1.5}
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
          />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonSize, "p-0")}
        onClick={() => onChange(isDisliked ? null : false)}
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
  /** Size variant: compact hides number labels and uses dropdown for high star counts */
  size?: RatingControlSize;
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
  size = "default",
  filledColors = DEFAULT_NUMERICAL_FILLED,
}: NumericalRatingControlProps) {
  const compact = size === "compact";

  const {
    filled: FilledIcon,
    outline: OutlineIcon,
    className: shapeClassName,
  } = useShapeIcons(serviceKey, starShape);

  // Use dropdown for high star counts in compact mode
  if (compact && maxStars >= COMPACT_DROPDOWN_THRESHOLD) {
    return (
      <NumericalRatingDropdown
        value={value}
        minStars={minStars}
        maxStars={maxStars}
        onChange={onChange}
        disabled={disabled}
        FilledIcon={FilledIcon}
        OutlineIcon={OutlineIcon}
        shapeClassName={shapeClassName}
        filledColors={filledColors}
      />
    );
  }

  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);
  const isZero = value === 0;
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
      aria-label={`Rating: ${value === null ? "no rating" : `${value} of ${maxStars}`}`}
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
          onClick={() => onChange(value === 0 ? null : 0)}
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
            onClick={() => onChange(value === 0 ? null : 0)}
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
          const isFilled = value !== null && star <= value;
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
                onChange(value === star ? null : star);
              }}
              disabled={isDisabled}
              aria-label={
                !isClickable
                  ? `${star} of ${maxStars} (disabled)`
                  : value === star
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
        aria-label={`Rating: ${displayValue} of ${maxStars}. Click to change`}
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
  service: RatingServiceInfo;
  /** Size variant for the control */
  size?: RatingControlSize;
}

export function IncDecRatingControl({
  value,
  onChange,
  disabled,
  service,
  size = "default",
}: IncDecRatingControlProps) {
  const compact = size === "compact";
  const buttonSize = compact ? "size-7" : "size-9.5";
  const iconSize = compact ? "size-4" : "size-6";
  const theme = useActiveTheme();
  const incDecColors = getIncDecPositiveColors(service);
  const incDecOverlayColor = getThemeAdjustedColorFromHex(
    incDecColors?.brush,
    theme,
  );

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
          "text-center tabular-nums",
          incDecOverlayColor
            ? "bg-background relative isolate overflow-hidden border border-(--badge-overlay)/50 text-(--badge-overlay) before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:bg-[color-mix(in_srgb,var(--badge-overlay)_20%,transparent)]"
            : "bg-muted border",
          compact
            ? "min-w-8 px-1.5 py-1 text-sm"
            : "min-w-10 px-2 py-1.5 text-base",
        )}
        style={
          incDecOverlayColor
            ? { "--badge-overlay": incDecOverlayColor }
            : undefined
        }
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
