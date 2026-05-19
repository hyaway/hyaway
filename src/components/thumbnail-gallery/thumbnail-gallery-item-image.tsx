// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import {
  useFullFileIdUrl,
  useThumbnailUrl,
} from "@/hooks/use-url-with-api-key";
import { isStaticImage } from "@/lib/mime-utils";
import { cn } from "@/lib/utils";

type GalleryImageSource = "thumbnail" | "full";

export interface ThumbnailImageProps extends React.HTMLAttributes<HTMLImageElement> {
  fileId: number;
  width?: number;
  height?: number;
  mime?: string;
  source?: GalleryImageSource;
  /** Image loading strategy. Defaults to "lazy". */
  loading?: "lazy" | "eager";
}

export function ThumbnailImage({
  fileId,
  className,
  width,
  height,
  mime,
  source = "thumbnail",
  loading = "lazy",
}: ThumbnailImageProps) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const thumbnail = useThumbnailUrl(fileId);
  const fullFile = useFullFileIdUrl(fileId);
  const shouldLoadFullImage =
    source === "full" && !!mime && isStaticImage(mime);
  const { url, onLoad, onError } = shouldLoadFullImage ? fullFile : thumbnail;
  const loaded = loadedUrl === url;

  const handleLoad = () => {
    setLoadedUrl(url);
    onLoad();
  };

  return (
    <img
      src={url}
      alt={`${shouldLoadFullImage ? "Image" : "Thumbnail"} for file ID ${fileId}`}
      className={cn(
        "h-full w-full starting:scale-98 starting:opacity-0",
        shouldLoadFullImage ? "object-contain" : "object-cover",
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
      loading={loading}
      decoding="async"
      onLoad={handleLoad}
      onError={onError}
      width={width}
      height={height}
    />
  );
}
