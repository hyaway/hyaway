// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { RatingsOverlayBadgeSize } from "@/components/ratings/ratings-overlay-badge-item";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { RatingsOverlayContent } from "@/components/ratings/ratings-overlay-content";

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
  return (
    <RatingsOverlayContent item={item} size={size} className={className} />
  );
}
