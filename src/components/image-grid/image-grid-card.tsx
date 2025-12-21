import { memo, useMemo } from "react";
import {
  ExclamationCircleIcon,
  InboxIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { useThumbnailFileIdUrl } from "@/hooks/use-url-with-api-key";
import { cn } from "@/lib/utils";

export interface ThumbnailProps extends React.HTMLAttributes<HTMLDivElement> {
  fileId: number;
  innerClassName?: string;
}

export function ThumbnailImage({ fileId, className }: ThumbnailProps) {
  const url = useThumbnailFileIdUrl(fileId);
  return (
    <img
      src={url}
      alt={`Thumbnail for file ID ${fileId}`}
      className={cn("h-full w-full object-cover", className)}
      loading="lazy"
    />
  );
}

export interface ImageCardProps extends React.HTMLAttributes<HTMLDivElement> {
  virtualRow: { lane: number; index: number };
  lanes: number;
  totalItemsCount: number;
  innerClassName?: string;
  item: FileMetadata;
  width: number;
}

export const ImageGridCard = memo(function ImageGridCard({
  virtualRow,
  lanes,
  totalItemsCount,
  className,
  innerClassName,
  item,
  width,
  ...props
}: ImageCardProps) {
  const scale = Math.max(
    Math.min(lanes * width, (item.thumbnail_width ?? width) * 1.1) / width,
    1.05,
  );

  const originClass = useMemo(() => {
    const isFirstLane = virtualRow.lane === 0;
    const isLastLane = virtualRow.lane === lanes - 1;
    const isTopRow = virtualRow.index < lanes;
    const lastRowStart = totalItemsCount - 2 * lanes;
    const isBottomRow = virtualRow.index >= lastRowStart;

    if (isTopRow && isFirstLane) return "origin-top-left";
    else if (isTopRow && isLastLane) return "origin-top-right";
    else if (isBottomRow && isFirstLane) return "origin-bottom-left";
    else if (isBottomRow && isLastLane) return "origin-bottom-right";
    else if (isTopRow) return "origin-top";
    else if (isBottomRow) return "origin-bottom";
    else if (isFirstLane) return "origin-left";
    else if (isLastLane) return "origin-right";
    else return "origin-center";
  }, [virtualRow.lane, virtualRow.index, lanes, totalItemsCount]);

  return (
    <div
      className={cn(`group relative h-full w-full overflow-visible`, className)}
      style={{
        [`--thumbnail-hover-scale`]: `${scale}`,
        [`--thumbnail-hover-reverse-scale`]: `${1 / scale}`,
      }}
      {...props}
    >
      <div
        className={cn(
          "bg-background h-full w-full overflow-hidden rounded border object-cover",
          "pointer-events-none transition-[scale] duration-100 ease-out group-hover:scale-(--thumbnail-hover-scale)",
          originClass,
        )}
      >
        <ThumbnailImage fileId={item.file_id} />
        {(item.is_inbox || item.is_trashed || item.is_deleted) && (
          <div
            className={cn(
              "bg-secondary absolute top-1 right-1 flex flex-col gap-2 rounded p-1 opacity-60",
              "pointer-events-none group-hover:top-0.5 group-hover:right-0.5 group-hover:scale-(--thumbnail-hover-reverse-scale) group-hover:opacity-30",
              "transition-opacity duration-350 ease-out",
            )}
          >
            {item.is_inbox && <InboxIcon className="h-4 w-4" />}
            {item.is_trashed && <TrashIcon className="h-4 w-4" />}
            {item.is_deleted && !item.is_trashed && (
              <ExclamationCircleIcon className="h-4 w-4" />
            )}
          </div>
        )}
      </div>
    </div>
  );
});
