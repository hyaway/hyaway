// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import {
  RenderFormat,
  useFullFileIdUrl,
  useRenderFileIdUrl,
  useThumbnailUrl,
} from "@/hooks/use-url-with-api-key";
import { isStaticImage } from "@/lib/mime-utils";
import {
  MB_IN_BYTES,
  normalizeOptimizeSizeThresholdMB,
} from "@/lib/optimize-image-settings";
import { cn } from "@/lib/utils";

type GalleryImageSource = "thumbnail" | "original" | "optimized";

export interface ThumbnailImageProps extends React.HTMLAttributes<HTMLImageElement> {
  fileId: number;
  width?: number;
  height?: number;
  mime?: string;
  size?: number | null;
  numFrames?: number | null;
  source?: GalleryImageSource;
  renderQuality?: number;
  optimizeSizeThresholdMB?: number;
  /** Image loading strategy. Defaults to "lazy". */
  loading?: "lazy" | "eager";
}

export function ThumbnailImage({
  fileId,
  className,
  width,
  height,
  mime,
  size,
  numFrames,
  source = "thumbnail",
  renderQuality = 90,
  optimizeSizeThresholdMB = 1,
  loading = "lazy",
}: ThumbnailImageProps) {
  const normalizedOptimizeSizeThresholdMB = normalizeOptimizeSizeThresholdMB(
    optimizeSizeThresholdMB,
  );
  const staticImage = !!mime && isStaticImage(mime);
  const renderDimensions = staticImage
    ? getOptimizedRenderDimensions(source, width, height)
    : undefined;
  const shouldLoadOptimizedImage =
    source === "optimized" &&
    staticImage &&
    (numFrames ?? 0) <= 1 &&
    size != null &&
    size > normalizedOptimizeSizeThresholdMB * MB_IN_BYTES &&
    renderDimensions !== undefined;
  const shouldLoadOriginalImage =
    staticImage && (source === "original" || source === "optimized");

  if (shouldLoadOptimizedImage) {
    return (
      <OptimizedImage
        fileId={fileId}
        className={className}
        width={width}
        height={height}
        renderWidth={renderDimensions.width}
        renderHeight={renderDimensions.height}
        renderQuality={renderQuality}
        loading={loading}
      />
    );
  }

  if (shouldLoadOriginalImage) {
    return (
      <OriginalImage
        fileId={fileId}
        className={className}
        width={width}
        height={height}
        loading={loading}
      />
    );
  }

  return (
    <ThumbnailUrlImage
      fileId={fileId}
      className={className}
      width={width}
      height={height}
      loading={loading}
    />
  );
}

interface SourceImageProps {
  fileId: number;
  className?: string;
  width?: number;
  height?: number;
  loading: "lazy" | "eager";
}

function ThumbnailUrlImage(props: SourceImageProps) {
  const media = useThumbnailUrl(props.fileId);

  return (
    <GalleryImageElement {...props} media={media} sourceType="thumbnail" />
  );
}

function OriginalImage(props: SourceImageProps) {
  const media = useFullFileIdUrl(props.fileId);

  return <GalleryImageElement {...props} media={media} sourceType="image" />;
}

interface OptimizedImageProps extends SourceImageProps {
  renderWidth: number;
  renderHeight: number;
  renderQuality: number;
}

function OptimizedImage({
  renderWidth,
  renderHeight,
  renderQuality,
  ...props
}: OptimizedImageProps) {
  const media = useRenderFileIdUrl(props.fileId, {
    renderFormat: RenderFormat.WEBP,
    renderQuality,
    width: renderWidth,
    height: renderHeight,
  });

  return <GalleryImageElement {...props} media={media} sourceType="image" />;
}

interface GalleryImageElementProps extends SourceImageProps {
  media: ReturnType<typeof useThumbnailUrl>;
  sourceType: "thumbnail" | "image";
}

function GalleryImageElement({
  media,
  sourceType,
  fileId,
  className,
  width,
  height,
  loading,
}: GalleryImageElementProps) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const { url, onLoad, onError } = media;
  const loaded = loadedUrl === url;

  const handleLoad = () => {
    setLoadedUrl(url);
    onLoad();
  };

  return (
    <img
      src={url}
      alt={`${sourceType === "image" ? "Image" : "Thumbnail"} for file ID ${fileId}`}
      className={cn(
        "h-full w-full starting:scale-98 starting:opacity-0",
        sourceType === "image" ? "object-contain" : "object-cover",
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

function getOptimizedRenderDimensions(
  source: GalleryImageSource,
  width: number | undefined,
  height: number | undefined,
) {
  if (source !== "optimized" || !width || !height) return undefined;

  const screenWidth = Math.round(window.screen.width * window.devicePixelRatio);
  const screenHeight = Math.round(
    window.screen.height * window.devicePixelRatio,
  );

  if (width <= screenWidth && height <= screenHeight) return undefined;

  const scale = Math.min(screenWidth / width, screenHeight / height);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
