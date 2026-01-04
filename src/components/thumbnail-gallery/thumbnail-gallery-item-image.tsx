import { useThumbnailUrl } from "@/hooks/use-url-with-api-key";
import { cn } from "@/lib/utils";

export interface ThumbnailImageProps extends React.HTMLAttributes<HTMLImageElement> {
  fileId: number;
  width?: number;
  height?: number;
}

export function ThumbnailImage({
  fileId,
  className,
  width,
  height,
}: ThumbnailImageProps) {
  const { url, onLoad, onError } = useThumbnailUrl(fileId);

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
        // Use blurhash average color from parent's --average-color CSS variable
        "group-data-[image-bg=average]/gallery:bg-(--average-color,var(--muted))",
        className,
      )}
      loading="lazy"
      onLoad={onLoad}
      onError={onError}
      width={width}
      height={height}
    />
  );
}
