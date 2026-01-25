// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { RatingsOverlayBadgeItem } from "@/components/ratings/ratings-overlay-badge-item";
import { useRatingsToShow } from "@/hooks/use-ratings-to-show";

interface ThumbnailRatingsOverlayContentProps {
  item: FileMetadata;
}

/**
 * Ratings overlay content for thumbnails.
 * Uses container queries (@[100px], @[150px]) for responsive sizing.
 * This allows the badges to scale based on thumbnail container width.
 */
export function ThumbnailRatingsOverlayContent({
  item,
}: ThumbnailRatingsOverlayContentProps) {
  const ratingsToShow = useRatingsToShow(item);

  if (ratingsToShow.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-0.5 @[150px]:gap-1">
      {ratingsToShow.map(({ serviceKey, service, value }) => (
        <RatingBadge
          key={serviceKey}
          serviceKey={serviceKey}
          service={service}
          value={value}
        />
      ))}
    </div>
  );
}

interface RatingBadgeProps {
  serviceKey: string;
  service: ReturnType<typeof useRatingsToShow>[number]["service"];
  value: ReturnType<typeof useRatingsToShow>[number]["value"];
}

function RatingBadge({ serviceKey, service, value }: RatingBadgeProps) {
  return (
    <RatingsOverlayBadgeItem
      serviceKey={serviceKey}
      service={service}
      value={value}
      variant="thumbnail"
    />
  );
}
