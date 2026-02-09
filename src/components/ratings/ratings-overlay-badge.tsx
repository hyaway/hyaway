// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { CrossedOutIcon } from "./crossed-out-icon";
import {
  getDislikeColors,
  getIncDecPositiveColors,
  getLikeColors,
  getNumericalFilledColors,
} from "./rating-colors";
import { useShapeIcons } from "./use-shape-icons";
import type { CSSProperties } from "react";
import type {
  RatingServiceInfo,
  RatingValue,
} from "@/integrations/hydrus-api/models";
import {
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { getThemeAdjustedColorFromHex } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/stores/theme-store";

interface RatingsOverlayBadgeProps {
  serviceKey: string;
  service: RatingServiceInfo;
  value: RatingValue;
  badgeClassName: string;
  iconClassName: string;
  valueClassName?: string;
  crossedOutBackslashClassName?: string;
}

export function RatingsOverlayBadge({
  serviceKey,
  service,
  value,
  badgeClassName,
  iconClassName,
  valueClassName = "tabular-nums leading-none translate-y-px",
  crossedOutBackslashClassName,
}: RatingsOverlayBadgeProps) {
  const theme = useActiveTheme();
  const {
    filled: FilledIcon,
    outline: OutlineIcon,
    className: shapeClassName,
  } = useShapeIcons(serviceKey, service.star_shape);

  const iconClass = cn(iconClassName, shapeClassName);

  if (isLikeRatingService(service)) {
    const isLiked = value === true;
    const isDisliked = value === false;

    if (isLiked) {
      const likeColors = getLikeColors(service);
      return (
        <div className={badgeClassName}>
          <FilledIcon
            className={iconClass}
            style={{ color: likeColors.brush, stroke: likeColors.pen }}
          />
        </div>
      );
    }
    if (isDisliked) {
      const dislikeColors = getDislikeColors(service);
      return (
        <div className={badgeClassName}>
          <CrossedOutIcon
            strokeBackgroundColor="text-card"
            backslashClassName={crossedOutBackslashClassName}
            style={{ color: dislikeColors.brush, stroke: dislikeColors.pen }}
          >
            <FilledIcon className={iconClass} />
          </CrossedOutIcon>
        </div>
      );
    }
    // Unset but showing because "show even when null"
    return (
      <div className={cn(badgeClassName, "text-muted-foreground")}>
        <OutlineIcon className={iconClass} />
      </div>
    );
  }

  if (isNumericalRatingService(service)) {
    const numValue = value as number | null;
    const maxStars = service.max_stars;
    const isUnset = numValue === null;
    const filledColors = getNumericalFilledColors(service);

    return (
      <div className={cn(badgeClassName, isUnset && "text-muted-foreground")}>
        <FilledIcon
          className={iconClass}
          style={
            !isUnset
              ? { color: filledColors.brush, stroke: filledColors.pen }
              : undefined
          }
        />
        <span className={valueClassName}>
          {numValue === null ? "-" : numValue}/{maxStars}
        </span>
      </div>
    );
  }

  // Inc/Dec
  const numValue = typeof value === "number" ? value : 0;
  const incDecColors = getIncDecPositiveColors(service);
  const incDecOverlayColor = getThemeAdjustedColorFromHex(
    incDecColors?.brush,
    theme,
  );
  const incDecStyle: CSSProperties | undefined = incDecOverlayColor
    ? { "--badge-overlay": incDecOverlayColor }
    : undefined;
  const useIncDecOverlay = Boolean(incDecOverlayColor);

  return (
    <div
      className={cn(
        badgeClassName,
        useIncDecOverlay &&
          "bg-background relative isolate overflow-hidden border-0 text-(--badge-overlay) before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:bg-[color-mix(in_srgb,var(--badge-overlay)_20%,transparent)]",
      )}
      style={incDecStyle}
    >
      <span className={valueClassName}>{numValue}</span>
    </div>
  );
}
