import { useState } from "react";

import { useThumbnailUrl } from "@/hooks/use-url-with-api-key";
import { cn } from "@/lib/utils";
import { checkerboardBg } from "@/lib/style-constants";
import { useImageBackground } from "@/stores/file-viewer-settings-store";
import { useGalleryEntryDuration } from "@/stores/gallery-settings-store";

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

  const entryDuration = useGalleryEntryDuration();

  return (
    <img
      src={url}
      alt={`Thumbnail for file ID ${fileId}`}
      style={{
        transitionDuration: `${entryDuration}ms`,
      }}
      className={cn(
        "h-full w-full object-cover starting:scale-98 starting:opacity-0",
        entryDuration > 0 && "transition-[opacity,scale]",
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
