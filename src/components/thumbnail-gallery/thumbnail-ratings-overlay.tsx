// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { ThumbnailRatingsOverlayContent } from "./thumbnail-ratings-overlay-content";
import type { FileMetadata } from "@/integrations/hydrus-api/models";

interface ThumbnailRatingsOverlayProps {
  item: FileMetadata;
}

/**
 * Ratings overlay for thumbnails.
 * Shows ratings icons in the top-right corner based on display settings.
 * Non-interactive (icons only).
 *
 * This is a thin wrapper that positions the ratings overlay content
 * using container query-based responsive sizing.
 */
export function ThumbnailRatingsOverlay({
  item,
}: ThumbnailRatingsOverlayProps) {
  return (
    <div className="pointer-events-none absolute top-0.5 right-0.5 @[150px]:top-1 @[150px]:right-1">
      <ThumbnailRatingsOverlayContent item={item} />
    </div>
  );
}
