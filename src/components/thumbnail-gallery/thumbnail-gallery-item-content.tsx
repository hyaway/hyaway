import {
  IconBan,
  IconMailFilled,
  IconMovie,
  IconTrashFilled,
  IconVolume,
} from "@tabler/icons-react";

import { ThumbnailImage } from "./thumbnail-gallery-item-image";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { BlurhashCanvas } from "@/components/blurhash-canvas";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import { formatBytes } from "@/lib/format-utils";
import { cn } from "@/lib/utils";

interface ThumbnailGalleryItemContentProps {
  item: FileMetadata;
}

export function ThumbnailGalleryItemContent({
  item,
}: ThumbnailGalleryItemContentProps) {
  const fileSize = formatBytes(item.size);
  const isPermanentlyDeleted = item.is_deleted && !item.is_trashed;
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
          ? ({
              "--average-color": averageColor,
            } as React.CSSProperties)
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
            width={item.thumbnail_width}
            height={item.thumbnail_height}
          />
        )}
      </div>
      <div className="bg-muted text-muted-foreground flex h-6 shrink-0 items-center gap-0.5 px-0.5 text-[8px] @[150px]:gap-1 @[150px]:px-1 @[150px]:text-xs">
        {item.mime.startsWith("video/") && (
          <IconMovie
            className="size-2 @[60px]:size-3 @[150px]:size-4"
            aria-label="Video"
          />
        )}
        {item.has_audio && (
          <IconVolume
            className="size-2 @[60px]:size-3 @[150px]:size-4"
            aria-label="Has audio"
          />
        )}
        {fileSize && (
          <span
            className="hidden @[100px]:inline"
            aria-label={`File size: ${fileSize}`}
          >
            {fileSize}
          </span>
        )}
        <span className="flex-1" />
        {item.is_inbox && (
          <IconMailFilled
            className="text-foreground size-2 @[60px]:size-3 @[150px]:size-4"
            aria-label="In inbox"
          />
        )}
        {item.is_trashed && (
          <IconTrashFilled
            className="text-destructive size-2 @[60px]:size-3 @[150px]:size-4"
            aria-label="Trashed"
          />
        )}
        {item.is_deleted && !item.is_trashed && (
          <IconBan
            className="text-destructive size-3 @[150px]:size-4"
            aria-label="Permanently deleted"
          />
        )}
      </div>
    </div>
  );
}
