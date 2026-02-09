// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { RatingsOverlayBadgeItem } from "./ratings-overlay-badge-item";
import type { RatingsOverlayBadgeSize } from "./ratings-overlay-badge-item";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import {
  isIncDecRatingService,
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { cn } from "@/lib/utils";
import { useRatingsToShow } from "@/hooks/use-ratings-to-show";

type RatingsOverlayContentProps = {
  item: FileMetadata;
  size: RatingsOverlayBadgeSize;
  className?: string;
};

export function RatingsOverlayContent({
  item,
  size,
  className,
}: RatingsOverlayContentProps) {
  const ratingsToShow = useRatingsToShow(item);
  const likeRatings = ratingsToShow.filter(({ service }) =>
    isLikeRatingService(service),
  );
  const incDecRatings = ratingsToShow.filter(({ service }) =>
    isIncDecRatingService(service),
  );
  const numericalRatings = ratingsToShow.filter(({ service }) =>
    isNumericalRatingService(service),
  );

  if (ratingsToShow.length === 0) {
    return null;
  }

  return (
    <div className={cn(getContainerClasses(size), className)}>
      {likeRatings.length > 0 && (
        <div className="bg-card/80 inline-flex items-center gap-0">
          {likeRatings.map(({ serviceKey, service, value }) => (
            <RatingsOverlayBadgeItem
              key={serviceKey}
              serviceKey={serviceKey}
              service={service}
              value={value}
              size={size}
              className="bg-transparent"
            />
          ))}
        </div>
      )}
      {numericalRatings.map(({ serviceKey, service, value }) => (
        <RatingsOverlayBadgeItem
          key={serviceKey}
          serviceKey={serviceKey}
          service={service}
          value={value}
          size={size}
          className="bg-card/80"
        />
      ))}
      {incDecRatings.length > 0 && (
        <div className="bg-card/80 inline-flex items-center gap-0">
          {incDecRatings.map(({ serviceKey, service, value }) => (
            <RatingsOverlayBadgeItem
              key={serviceKey}
              serviceKey={serviceKey}
              service={service}
              value={value}
              size={size}
              className="bg-transparent"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getContainerClasses(size: RatingsOverlayBadgeSize) {
  return cn(
    "pointer-events-none flex flex-col items-end gap-0",
    size === "md" && "gap-0.5",
    size === "lg" && "gap-1",
  );
}
