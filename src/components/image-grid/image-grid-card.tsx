import { useMemo } from "react";
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
      className={cn(
        "h-full w-full overflow-visible object-cover transition-[width,height,transform]",
        className,
      )}
      loading="lazy"
    />
  );
}

export interface ImageCardProps extends React.HTMLAttributes<HTMLDivElement> {
  fileId: number;
  virtualRow: { lane: number; index: number };
  lanes: number;
  totalItemsCount: number;
  innerClassName?: string;
}

export function ImageGridCard({
  fileId,
  virtualRow,
  lanes,
  totalItemsCount,
  className,
  innerClassName,
  ...props
}: ImageCardProps) {
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
      {...props}
      className={cn(`group h-full w-full overflow-visible`, className)}
    >
      <div
        className={cn(
          "h-full w-full overflow-hidden rounded border object-cover transition-[width,height,transform] duration-350 ease-out group-hover:scale-(--thumbnail-hover-scale) hover:pointer-events-none",
          originClass,
        )}
      >
        <ThumbnailImage fileId={fileId} />
      </div>
    </div>
  );
}
