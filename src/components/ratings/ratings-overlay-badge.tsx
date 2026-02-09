// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTimeline } from "@tabler/icons-react";

import { CrossedOutIcon } from "./crossed-out-icon";
import {
  getDislikeColors,
  getIncDecPositiveColors,
  getLikeColors,
  getNumericalFilledColors,
} from "./rating-colors";
import { useShapeIcons } from "./use-shape-icons";
import type {
  RatingServiceInfo,
  RatingValue,
} from "@/integrations/hydrus-api/models";
import {
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { cn } from "@/lib/utils";

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
      <div className={cn(badgeClassName, "bg-card/60 text-muted-foreground")}>
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
      <div
        className={cn(
          badgeClassName,
          isUnset && "bg-card/60 text-muted-foreground",
        )}
      >
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
  const sign = numValue > 0 ? "+" : "";
  const isZero = numValue === 0;
  const isPositive = numValue > 0;

  const incDecColors = isPositive ? getIncDecPositiveColors(service) : null;

  return (
    <div
      className={cn(
        badgeClassName,
        isZero && "bg-card/60 text-muted-foreground",
      )}
    >
      <IconTimeline
        className={iconClass}
        style={incDecColors ? { color: incDecColors.brush } : undefined}
      />
      <span className={valueClassName}>
        {sign}
        {numValue}
      </span>
    </div>
  );
}
