import { useState } from "react";

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
  const [loaded, setLoaded] = useState(false);
  const { url, onLoad, onError } = useThumbnailUrl(fileId);

  const handleLoad = () => {
    setLoaded(true);
    onLoad();
  };

  return (
    <img
      src={url}
      alt={`Thumbnail for file ID ${fileId}`}
      className={cn(
        "h-full w-full object-cover starting:scale-98 starting:opacity-0",
        "transition-[opacity,scale] duration-(--gallery-entry-duration)",
        // Before load: always use average color from parent's --average-color CSS variable
        !loaded && "bg-(--average-color,var(--muted))/50",
        // After load: apply background based on setting
        loaded && [
          "group-data-[image-bg=checkerboard]/gallery:bg-(image:--checkerboard-bg) group-data-[image-bg=checkerboard]/gallery:bg-size-[20px_20px]",
          "group-data-[image-bg=solid]/gallery:bg-muted",
          "group-data-[image-bg=average]/gallery:bg-(--average-color,var(--muted))",
        ],
        className,
      )}
      loading="lazy"
      decoding="async"
      onLoad={handleLoad}
      onError={onError}
      width={width}
      height={height}
    />
  );
}
