// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { ThumbnailGalleryItemFooter } from "./thumbnail-gallery-item-footer";
import { ThumbnailImage } from "./thumbnail-gallery-item-image";
import { ThumbnailRatingsOverlay } from "./thumbnail-ratings-overlay";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { BlurhashCanvas } from "@/components/blurhash-canvas";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import { isStaticImage } from "@/lib/mime-utils";
import { cn } from "@/lib/utils";

interface ThumbnailGalleryItemContentProps {
  item: FileMetadata;
  loadFullSizeImages?: boolean;
  showFooter?: boolean;
  /** Image loading strategy passed to thumbnail. Defaults to "lazy". */
  imageLoading?: "lazy" | "eager";
}

export function ThumbnailGalleryItemContent({
  item,
  loadFullSizeImages = false,
  showFooter = true,
  imageLoading,
}: ThumbnailGalleryItemContentProps) {
  const isPermanentlyDeleted = item.is_deleted && !item.is_trashed;
  const shouldLoadFullImage = loadFullSizeImages && isStaticImage(item.mime);
  const averageColor = getAverageColorFromBlurhash(item.blurhash ?? undefined);

  return (
    <div
      className={cn(
        "text-muted-foreground @container relative flex h-full w-full flex-col overflow-hidden rounded-sm shadow-sm",
        averageColor ? `bg-(--average-color)/50` : "bg-muted",
        "pointer-events-none",
      )}
      style={
        averageColor
          ? {
              "--average-color": averageColor,
            }
          : undefined
      }
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {isPermanentlyDeleted && item.blurhash ? (
          <BlurhashCanvas
            blurhash={item.blurhash}
            width={32}
            height={32}
            className="h-full w-full"
            aria-label={`Blurhash for file ${item.file_id}`}
          />
        ) : (
          <ThumbnailImage
            fileId={item.file_id}
            width={shouldLoadFullImage ? item.width : item.thumbnail_width}
            height={shouldLoadFullImage ? item.height : item.thumbnail_height}
            mime={item.mime}
            source={shouldLoadFullImage ? "full" : "thumbnail"}
            loading={imageLoading}
          />
        )}
        <ThumbnailRatingsOverlay item={item} />
      </div>
      {showFooter && <ThumbnailGalleryItemFooter item={item} />}
    </div>
  );
}
