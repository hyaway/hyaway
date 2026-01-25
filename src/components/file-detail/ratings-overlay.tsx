// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import type { RatingsOverlayBadgeSize } from "@/components/ratings/ratings-overlay-badge-item";
import { cn } from "@/lib/utils";
import { RatingsOverlayBadgeItem } from "@/components/ratings/ratings-overlay-badge-item";
import { useRatingsToShow } from "@/hooks/use-ratings-to-show";

type RatingsOverlaySize = RatingsOverlayBadgeSize;

interface RatingsOverlayProps {
  item: FileMetadata;
  /** Size variant for the badges */
  size?: RatingsOverlaySize;
  /** Additional class names for the container */
  className?: string;
}

/**
 * Ratings overlay component for displaying rating badges.
 * Shows ratings icons based on display settings.
 * Non-interactive (icons only).
 *
 * Used in:
 * - Thumbnails (responsive sizing via container queries)
 * - File viewer overlay
 * - Review card overlay
 */
export function RatingsOverlay({
  item,
  size = "md",
  className,
}: RatingsOverlayProps) {
  const ratingsToShow = useRatingsToShow(item);

  if (ratingsToShow.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none flex flex-col items-end gap-0.5",
        size === "sm" && "gap-0.5",
        size === "md" && "gap-1",
        size === "lg" && "gap-1.5",
        className,
      )}
    >
      {ratingsToShow.map(({ serviceKey, service, value }) => (
        <RatingBadge
          key={serviceKey}
          serviceKey={serviceKey}
          service={service}
          value={value}
          size={size}
        />
      ))}
    </div>
  );
}

interface RatingBadgeProps {
  serviceKey: string;
  service: ReturnType<typeof useRatingsToShow>[number]["service"];
  value: ReturnType<typeof useRatingsToShow>[number]["value"];
  size: RatingsOverlaySize;
}

function RatingBadge({ serviceKey, service, value, size }: RatingBadgeProps) {
  return (
    <RatingsOverlayBadgeItem
      serviceKey={serviceKey}
      service={service}
      value={value}
      variant="overlay"
      size={size}
    />
  );
}
