// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import {
  IconStarFilled,
  IconTallymarks,
  IconThumbDownFilled,
  IconThumbUp,
  IconThumbUpFilled,
} from "@tabler/icons-react";

import type {
  FileMetadata,
  RatingValue,
  ServiceInfo,
} from "@/integrations/hydrus-api/models";
import { ServiceType } from "@/integrations/hydrus-api/models";
import { useGetServicesQuery } from "@/integrations/hydrus-api/queries/services";
import {
  useRatingsDisplaySettingsActions,
  useRatingsServiceSettings,
} from "@/stores/ratings-display-settings-store";
import { cn } from "@/lib/utils";

interface ThumbnailRatingsOverlayProps {
  item: FileMetadata;
}

/**
 * Ratings overlay for thumbnails.
 * Shows ratings icons in the top-right corner based on display settings.
 * Non-interactive (icons only).
 */
export function ThumbnailRatingsOverlay({
  item,
}: ThumbnailRatingsOverlayProps) {
  const { data: servicesData } = useGetServicesQuery();
  const serviceSettings = useRatingsServiceSettings();
  const { getServiceSettings } = useRatingsDisplaySettingsActions();

  const ratingsToShow = useMemo(() => {
    if (!servicesData?.services || !item.ratings) return [];

    return Object.entries(servicesData.services)
      .filter(([serviceKey, service]) => {
        // Only rating services
        if (
          service.type !== ServiceType.RATING_LIKE &&
          service.type !== ServiceType.RATING_NUMERICAL &&
          service.type !== ServiceType.RATING_INC_DEC
        ) {
          return false;
        }

        const settings = getServiceSettings(serviceKey);
        if (!settings.show_in_thumbnail) return false;

        const ratingValue = item.ratings?.[serviceKey];

        // Check if we should show when null/unset
        if (!settings.show_in_thumbnail_even_when_null) {
          // Like/Dislike: null means unset
          if (
            service.type === ServiceType.RATING_LIKE &&
            ratingValue === null
          ) {
            return false;
          }
          // Numerical: null means unset
          if (
            service.type === ServiceType.RATING_NUMERICAL &&
            ratingValue === null
          ) {
            return false;
          }
          // Inc/Dec: 0 is treated as "not set" for the second toggle
          if (
            service.type === ServiceType.RATING_INC_DEC &&
            ratingValue === 0
          ) {
            return false;
          }
        }

        return true;
      })
      .map(([serviceKey, service]) => ({
        serviceKey,
        service,
        value: item.ratings?.[serviceKey] ?? null,
      }));
  }, [
    servicesData?.services,
    item.ratings,
    serviceSettings,
    getServiceSettings,
  ]);

  if (ratingsToShow.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute top-0.5 right-0.5 flex flex-col items-end gap-0.5 @[150px]:top-1 @[150px]:right-1 @[150px]:gap-1">
      {ratingsToShow.map(({ serviceKey, service, value }) => (
        <RatingBadge key={serviceKey} service={service} value={value} />
      ))}
    </div>
  );
}

interface RatingBadgeProps {
  service: ServiceInfo;
  value: RatingValue;
}

function RatingBadge({ service, value }: RatingBadgeProps) {
  const iconClass = "size-2.5 @[100px]:size-3 @[150px]:size-3.5";
  const badgeClass =
    "flex items-center gap-0.5 rounded-xs bg-card/80 px-0.5 py-0.25 text-[8px] text-foreground @[100px]:gap-0.5 @[100px]:px-1 @[100px]:text-[10px] @[150px]:gap-1 @[150px]:px-1.5 @[150px]:text-xs font-extrabold dark:font-semibold tabular-nums";

  if (service.type === ServiceType.RATING_LIKE) {
    const isLiked = value === true;
    const isDisliked = value === false;

    if (isLiked) {
      return (
        <div className={badgeClass}>
          <IconThumbUpFilled
            className={cn(iconClass, "text-green-600 dark:text-green-400")}
          />
        </div>
      );
    }
    if (isDisliked) {
      return (
        <div className={badgeClass}>
          <IconThumbDownFilled
            className={cn(iconClass, "text-red-600 dark:text-red-400")}
          />
        </div>
      );
    }
    // Unset but showing because "show even when null"
    return (
      <div className={cn(badgeClass, "bg-card/60 text-muted-foreground")}>
        <IconThumbUp className={iconClass} />
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
          badgeClass,
          isUnset && "bg-card/60 text-muted-foreground",
        )}
      >
        <IconStarFilled
          className={cn(
            iconClass,
            !isUnset && "text-amber-600 dark:text-amber-300",
          )}
        />
        <span className="tabular-nums">
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
        className={cn(badgeClass, isZero && "bg-card/60 text-muted-foreground")}
      >
        <IconTallymarks className={iconClass} />
        <span className="tabular-nums">
          {sign}
          {numValue}
        </span>
      </div>
    );
  }

  return null;
}
