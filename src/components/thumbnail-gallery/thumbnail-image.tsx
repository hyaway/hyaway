import { useState } from "react";

import { useThumbnailUrl } from "@/hooks/use-url-with-api-key";
import { cn } from "@/lib/utils";
import { checkerboardBg } from "@/lib/style-constants";
import { useImageBackground } from "@/stores/file-viewer-settings-store";

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
  const imageBackground = useImageBackground();

  const handleLoad = (_e: React.SyntheticEvent<HTMLImageElement>) => {
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
        loaded && imageBackground === "checkerboard"
          ? checkerboardBg
          : "bg-muted",
        className,
      )}
      loading="lazy"
      onLoad={handleLoad}
      onError={onError}
      width={width}
      height={height}
    />
  );
}
