import { useMemo } from "react";

import { useThumbnailUrl } from "@/hooks/use-url-with-api-key";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

export interface ThumbnailImageProps extends React.HTMLAttributes<HTMLImageElement> {
  fileId: number;
  width?: number;
  height?: number;
  /** Blurhash string used to extract average color for loading background */
  blurhash?: string;
}

export function ThumbnailImage({
  fileId,
  className,
  width,
  height,
  blurhash,
}: ThumbnailImageProps) {
  const { url, onLoad, onError } = useThumbnailUrl(fileId);

  const averageColor = useMemo(
    () => getAverageColorFromBlurhash(blurhash),
    [blurhash],
  );

  return (
    <img
      src={url}
      alt={`Thumbnail for file ID ${fileId}`}
      className={cn(
        "h-full w-full object-cover starting:scale-98 starting:opacity-0",
        "transition-[opacity,scale] duration-(--gallery-entry-duration)",
        // Checkerboard applied via ancestor data-image-bg attribute
        // See styles.css for the [data-image-bg=checkerboard] rule
        "group-data-[image-bg=checkerboard]/gallery:bg-(image:--checkerboard-bg) group-data-[image-bg=checkerboard]/gallery:bg-size-[20px_20px]",
        // Use bg-muted for solid background
        "group-data-[image-bg=solid]/gallery:bg-muted",
        // Use blurhash average color (falls back to muted via CSS variable default)
        "group-data-[image-bg=average]/gallery:bg-(--average-color,var(--muted))",
        className,
      )}
      style={
        // Set --average-color CSS variable for the average background option
        averageColor
          ? ({ "--average-color": averageColor } as React.CSSProperties)
          : undefined
      }
      loading="lazy"
      onLoad={onLoad}
      onError={onError}
      width={width}
      height={height}
    />
  );
}
