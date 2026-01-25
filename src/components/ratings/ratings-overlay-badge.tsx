// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTallymarks } from "@tabler/icons-react";

import { CrossedOutIcon } from "./crossed-out-icon";
import { useShapeIcons } from "./use-shape-icons";
import type {
  RatingValue,
  ServiceInfo,
} from "@/integrations/hydrus-api/models";
import { ServiceType } from "@/integrations/hydrus-api/models";
import { cn } from "@/lib/utils";

interface RatingsOverlayBadgeProps {
  serviceKey: string;
  service: ServiceInfo;
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

  if (service.type === ServiceType.RATING_LIKE) {
    const isLiked = value === true;
    const isDisliked = value === false;

    if (isLiked) {
      return (
        <div className={badgeClassName}>
          <FilledIcon className={cn(iconClass, "text-emerald-500")} />
        </div>
      );
    }
    if (isDisliked) {
      return (
        <div className={badgeClassName}>
          <CrossedOutIcon
            className="text-destructive"
            strokeBackgroundColor="text-card"
            backslashClassName={crossedOutBackslashClassName}
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

  if (service.type === ServiceType.RATING_NUMERICAL) {
    const numValue = value as number | null;
    const maxStars = service.max_stars ?? 5;
    const isUnset = numValue === null;

    return (
      <div
        className={cn(
          badgeClassName,
          isUnset && "bg-card/60 text-muted-foreground",
        )}
      >
        <FilledIcon className={cn(iconClass, !isUnset && "text-amber-500")} />
        <span className={valueClassName}>
          {numValue === null ? "-" : numValue}/{maxStars}
        </span>
      </div>
    );
  }

  if (service.type === ServiceType.RATING_INC_DEC) {
    const numValue = typeof value === "number" ? value : 0;
    const sign = numValue > 0 ? "+" : "";
    const isZero = numValue === 0;

    return (
      <div
        className={cn(
          badgeClassName,
          isZero && "bg-card/60 text-muted-foreground",
        )}
      >
        <IconTallymarks className={iconClass} />
        <span className={valueClassName}>
          {sign}
          {numValue}
        </span>
      </div>
    );
  }

  return null;
}
