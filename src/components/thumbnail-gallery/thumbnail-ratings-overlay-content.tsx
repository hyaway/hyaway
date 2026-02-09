// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { RatingsOverlayContent } from "@/components/ratings/ratings-overlay-content";

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
  return <RatingsOverlayContent item={item} size="sm" />;
}
