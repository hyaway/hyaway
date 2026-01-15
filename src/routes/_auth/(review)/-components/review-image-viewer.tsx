import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { isImageProjectFile, isStaticImage } from "@/lib/mime-utils";
import {
  RenderFormat,
  useFullFileIdUrl,
  useRenderFileIdUrl,
} from "@/hooks/use-url-with-api-key";
import { useReviewImageLoadMode } from "@/stores/review-queue-store";
import {
  useFillCanvasBackground,
  useImageBackground,
} from "@/stores/file-viewer-settings-store";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import { BlurhashCanvas } from "@/components/blurhash-canvas";

// Tolerance for matching fit scale (±2%)
const SCALE_TOLERANCE = 0.02;
// Max zoom bound
const MAX_ZOOM = 4.0;
// Scroll wheel zoom sensitivity
const WHEEL_ZOOM_STEP = 0.001;

interface ReviewImageViewerProps {
  fileId: number;
  mime: string;
  width: number | null;
  height: number | null;
  numFrames?: number | null;
  blurhash: string | null;
  onLoad: () => void;
  onError: () => void;
  /** Whether this is the top (active) card */
  isTop?: boolean;
}

export function ReviewImageViewer({
  fileId,
  mime,
  width: metadataWidth,
  height: metadataHeight,
  numFrames,
  blurhash,
  onLoad,
  onError,
  isTop = false,
}: ReviewImageViewerProps) {
  const imageLoadMode = useReviewImageLoadMode();
  const imageBackground = useImageBackground();
  const fillCanvasBackground = useFillCanvasBackground();

  // Compute average color from blurhash for backgrounds
  const averageColor = useMemo(
    () => getAverageColorFromBlurhash(blurhash ?? undefined),
    [blurhash],
  );

  // Calculate render dimensions for "fit" mode - preserve aspect ratio within screen bounds
  const renderDimensions = useMemo(() => {
    if (imageLoadMode !== "resized") return undefined;
    if (!metadataWidth || !metadataHeight) return undefined;

    const screenWidth = Math.round(
      window.screen.width * window.devicePixelRatio,
    );
    const screenHeight = Math.round(
      window.screen.height * window.devicePixelRatio,
    );

    // If image is smaller than screen, no need to resize
    if (metadataWidth <= screenWidth && metadataHeight <= screenHeight) {
      return undefined;
    }

    // Calculate scale factor to fit within screen while preserving aspect ratio
    const scaleX = screenWidth / metadataWidth;
    const scaleY = screenHeight / metadataHeight;
    const scale = Math.min(scaleX, scaleY);

    return {
      width: Math.round(metadataWidth * scale),
      height: Math.round(metadataHeight * scale),
    };
  }, [imageLoadMode, metadataWidth, metadataHeight]);

  // Check if this mime type is a static image or image project file
  const staticImage = isStaticImage(mime);
  const imageProjectFile = isImageProjectFile(mime);
  const isAnimated = (numFrames ?? 0) > 1;

  // Determine render dimensions:
  // - For "resized" mode: fit to screen
  // - For "original" mode with project files: use full metadata dimensions
  const projectFileFullDimensions =
    imageProjectFile &&
    imageLoadMode === "original" &&
    metadataWidth &&
    metadataHeight
      ? { width: metadataWidth, height: metadataHeight }
      : undefined;

  // Use appropriate URL based on image load mode
  // Render endpoint only supports static images (not GIF/APNG/animated WEBP)
  const fullUrl = useFullFileIdUrl(fileId);
  const renderUrl = useRenderFileIdUrl(fileId, {
    renderFormat: RenderFormat.WEBP,
    renderQuality: 90,
    ...(renderDimensions ?? projectFileFullDimensions),
  });

  // Select URL based on mode:
  // - Image project files always use render (browsers can't display them)
  // - Static images use render when "resized" mode enabled and image is larger than screen
  const useRenderedImage =
    imageProjectFile ||
    (imageLoadMode === "resized" &&
      staticImage &&
      !isAnimated &&
      renderDimensions !== undefined);
  const {
    url: fileUrl,
    onLoad: onUrlLoad,
    onError: onUrlError,
  } = useRenderedImage ? renderUrl : fullUrl;
  const [loaded, setLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Track if user is actively zooming (for showing indicator)
  const [isZooming, setIsZooming] = useState(false);
  const zoomTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Zoom state: "fit" follows fitScale, number is explicit scale
  const [zoomMode, setZoomMode] = useState<"fit" | number>("fit");

  // Framer Motion values for pan and zoom
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const scaleMotion = useMotionValue(1);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Calculate fit scale
  const fitScale = useMemo(() => {
    if (
      naturalSize.width === 0 ||
      naturalSize.height === 0 ||
      containerSize.width === 0 ||
      containerSize.height === 0
    ) {
      return 1;
    }
    const scaleX = containerSize.width / naturalSize.width;
    const scaleY = containerSize.height / naturalSize.height;
    return Math.min(scaleX, scaleY, 1);
  }, [naturalSize, containerSize]);

  // Actual zoom scale
  const zoomScale = zoomMode === "fit" ? fitScale : zoomMode;

  // Sync motion value with computed scale
  useEffect(() => {
    scaleMotion.set(zoomScale);
  }, [zoomScale, scaleMotion]);

  // Derived motion values for image dimensions
  const scaledWidth = useTransform(scaleMotion, (s) => naturalSize.width * s);
  const scaledHeight = useTransform(scaleMotion, (s) => naturalSize.height * s);

  // Min zoom is fit scale
  const minZoom = fitScale;

  // Check if at fit scale
  const isAtFit =
    zoomMode === "fit" || Math.abs(zoomScale - fitScale) <= SCALE_TOLERANCE;

  const dragConstraints = useMemo(() => {
    if (
      !isTop ||
      naturalSize.width === 0 ||
      naturalSize.height === 0 ||
      containerSize.width === 0 ||
      containerSize.height === 0
    ) {
      return { left: 0, right: 0, top: 0, bottom: 0 };
    }

    const imgWidth = naturalSize.width * zoomScale;
    const imgHeight = naturalSize.height * zoomScale;

    const maxPanX = Math.abs(imgWidth - containerSize.width) / 2;
    const maxPanY = Math.abs(imgHeight - containerSize.height) / 2;

    return {
      left: -maxPanX,
      right: maxPanX,
      top: -maxPanY,
      bottom: maxPanY,
    };
  }, [isTop, naturalSize, containerSize, zoomScale]);

  // Track container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Reset zoom when card is no longer top
  useEffect(() => {
    if (!isTop) {
      setZoomMode("fit");
      dragX.stop();
      dragY.stop();
      dragX.set(0);
      dragY.set(0);
    }
  }, [isTop, dragX, dragY]);

  const handleLoad = () => {
    setLoaded(true);
    if (imageRef.current) {
      setNaturalSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
    onUrlLoad();
    onLoad();
  };

  const handleError = () => {
    onUrlError();
    onError();
  };

  // Show zoom indicator briefly
  const showZoomIndicator = useCallback(() => {
    setIsZooming(true);
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    zoomTimeoutRef.current = setTimeout(() => {
      setIsZooming(false);
    }, 1000);
  }, []);

  const smoothCenterImage = useCallback(() => {
    dragX.stop();
    dragY.stop();
    animate(dragX, 0, { type: "spring", stiffness: 100, damping: 30 });
    animate(dragY, 0, { type: "spring", stiffness: 100, damping: 30 });
    setIsDragging(false);
  }, [dragX, dragY]);

  // Keep image centered whenever we return to fit mode
  useEffect(() => {
    if (zoomMode === "fit") {
      smoothCenterImage();
    }
  }, [zoomMode, smoothCenterImage]);

  // Adjust zoom with anchor point
  // skipDragUpdate: when true, only changes scale without moving the image (used during drag)
  const adjustZoom = useCallback(
    (
      delta: number,
      anchorX: number,
      anchorY: number,
      skipDragUpdate = false,
      allowSnapToOne = false,
    ) => {
      const container = containerRef.current;
      if (!container || naturalSize.width === 0) return;

      const containerRect = container.getBoundingClientRect();
      const currentScale = scaleMotion.get();

      // Calculate current image bounds in container space
      const currentWidth = naturalSize.width * currentScale;
      const currentHeight = naturalSize.height * currentScale;
      const currentDragX = dragX.get();
      const currentDragY = dragY.get();

      const imgCenterX = containerRect.width / 2 + currentDragX;
      const imgCenterY = containerRect.height / 2 + currentDragY;

      const imgLeft = imgCenterX - currentWidth / 2;
      const imgRight = imgCenterX + currentWidth / 2;
      const imgTop = imgCenterY - currentHeight / 2;
      const imgBottom = imgCenterY + currentHeight / 2;

      // Clamp anchor to image bounds (handles cursor outside image when zooming out)
      const clampedAnchorX = Math.max(imgLeft, Math.min(imgRight, anchorX));
      const clampedAnchorY = Math.max(imgTop, Math.min(imgBottom, anchorY));
      let newScale = Math.max(
        minZoom,
        Math.min(MAX_ZOOM, currentScale + delta),
      );

      if (newScale === currentScale) return;

      // If we hit minimum zoom (zooming out), snap to fit mode
      if (delta < 0 && newScale <= minZoom + SCALE_TOLERANCE) {
        scaleMotion.set(fitScale);
        setZoomMode("fit");
        // Smoothly center the image when returning to fit mode
        smoothCenterImage();
        showZoomIndicator();
        return;
      }

      if (allowSnapToOne) {
        // Snap to 1x when crossing through it
        const crossingToOneFromBelow =
          delta > 0 && currentScale < 1.0 && newScale >= 1.0 - SCALE_TOLERANCE;
        const crossingToOneFromAbove =
          delta < 0 && currentScale > 1.0 && newScale <= 1.0 + SCALE_TOLERANCE;
        if (crossingToOneFromBelow || crossingToOneFromAbove) {
          newScale = 1.0;
        }
      }

      scaleMotion.set(newScale);
      setZoomMode(newScale);
      showZoomIndicator();

      // Get new image dimensions
      const newWidth = naturalSize.width * newScale;
      const newHeight = naturalSize.height * newScale;

      // Calculate max pan bounds
      // Use absolute difference so anchor stays stable even when image is smaller than container
      const maxPanX = Math.abs(newWidth - containerRect.width) / 2;
      const maxPanY = Math.abs(newHeight - containerRect.height) / 2;

      let newDragX = 0;
      let newDragY = 0;

      // If user is actively dragging, just clamp current drag to new bounds
      if (skipDragUpdate) {
        newDragX = Math.max(-maxPanX, Math.min(maxPanX, currentDragX));
        newDragY = Math.max(-maxPanY, Math.min(maxPanY, currentDragY));
        dragX.set(newDragX);
        dragY.set(newDragY);
        return;
      }

      // Only do anchor-based positioning if there's room to pan
      if (maxPanX > 0 || maxPanY > 0) {
        const anchorFromCenterX = clampedAnchorX - containerRect.width / 2;
        const anchorFromCenterY = clampedAnchorY - containerRect.height / 2;

        const imagePointX = anchorFromCenterX - currentDragX;
        const imagePointY = anchorFromCenterY - currentDragY;

        const scaleFactor = newScale / currentScale;

        const newImagePointX = imagePointX * scaleFactor;
        const newImagePointY = imagePointY * scaleFactor;

        newDragX = anchorFromCenterX - newImagePointX;
        newDragY = anchorFromCenterY - newImagePointY;

        newDragX = Math.max(-maxPanX, Math.min(maxPanX, newDragX));
        newDragY = Math.max(-maxPanY, Math.min(maxPanY, newDragY));
      }

      dragX.set(newDragX);
      dragY.set(newDragY);
    },
    [
      minZoom,
      fitScale,
      naturalSize,
      dragX,
      dragY,
      scaleMotion,
      showZoomIndicator,
      smoothCenterImage,
    ],
  );

  // Wheel zoom handler for image (cursor anchor)
  // When dragging, skip drag position update so image stays "grabbed"
  const handleImageWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isTop) return;

      e.preventDefault();
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentScale = scaleMotion.get();
      const factor = Math.pow(1.1, -e.deltaY * WHEEL_ZOOM_STEP * 10);
      const delta = currentScale * factor - currentScale;

      const anchorX = e.clientX - rect.left;
      const anchorY = e.clientY - rect.top;

      // Skip drag update when actively dragging so image stays "grabbed"
      adjustZoom(delta, anchorX, anchorY, isDragging);
    },
    [isTop, scaleMotion, adjustZoom, isDragging],
  );

  // Wheel zoom handler for container (closest edge anchor)
  const handleContainerWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isTop) return;

      e.preventDefault();
      const containerRect = containerRef.current?.getBoundingClientRect();
      const imageRect = imageRef.current?.getBoundingClientRect();
      if (!containerRect || !imageRect) return;

      const currentScale = scaleMotion.get();
      const factor = Math.pow(1.1, -e.deltaY * WHEEL_ZOOM_STEP * 10);
      const delta = currentScale * factor - currentScale;

      const cursorX = e.clientX - containerRect.left;
      const cursorY = e.clientY - containerRect.top;

      const imgLeft = imageRect.left - containerRect.left;
      const imgRight = imageRect.right - containerRect.left;
      const imgTop = imageRect.top - containerRect.top;
      const imgBottom = imageRect.bottom - containerRect.top;

      const anchorX = Math.max(imgLeft, Math.min(imgRight, cursorX));
      const anchorY = Math.max(imgTop, Math.min(imgBottom, cursorY));

      adjustZoom(delta, anchorX, anchorY);
    },
    [isTop, scaleMotion, adjustZoom],
  );

  // Pinch zoom state
  const pinchStateRef = useRef<{
    initialDistance: number;
    initialScale: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  // Touch handlers for pinch zoom
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isTop || e.touches.length !== 2) return;

      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );

      const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
      const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

      pinchStateRef.current = {
        initialDistance: distance,
        initialScale: zoomScale,
        centerX,
        centerY,
      };
    },
    [isTop, zoomScale],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isTop || e.touches.length !== 2 || !pinchStateRef.current) return;

      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );

      const { initialDistance, initialScale, centerX, centerY } =
        pinchStateRef.current;

      const scaleRatio = distance / initialDistance;
      const newScale = Math.max(
        minZoom,
        Math.min(MAX_ZOOM, initialScale * scaleRatio),
      );

      const newCenterX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
      const newCenterY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

      const anchorX = (centerX + newCenterX) / 2;
      const anchorY = (centerY + newCenterY) / 2;

      const currentScale = scaleMotion.get();
      const delta = newScale - currentScale;
      if (Math.abs(delta) > 0.001) {
        // Gestures should not snap to 1x
        adjustZoom(delta, anchorX, anchorY, false, false);
      }
    },
    [isTop, minZoom, scaleMotion, adjustZoom],
  );

  const handleTouchEnd = useCallback(() => {
    pinchStateRef.current = null;
  }, []);

  // Determine if zoomed (not at fit)
  const isZoomed = !isAtFit;

  // Cursor based on zoom state
  const getCursor = () => {
    if (isZoomed) {
      return isDragging ? "cursor-grabbing" : "cursor-grab";
    }
    return "";
  };

  // Container background (when fillCanvasBackground is enabled)
  const getContainerBackgroundClass = () => {
    if (!fillCanvasBackground || !loaded) return "";
    switch (imageBackground) {
      case "checkerboard":
        return "bg-(image:--checkerboard-bg) bg-size-[20px_20px]";
      case "solid":
        return "bg-muted";
      case "average":
        return ""; // Handled via inline style
      default:
        return "";
    }
  };

  const getContainerStyle = () => {
    if (
      fillCanvasBackground &&
      imageBackground === "average" &&
      averageColor &&
      loaded
    ) {
      return { backgroundColor: averageColor };
    }
    return {};
  };

  // Image background (when not using fill canvas)
  const getImageBackgroundClass = () => {
    if (!loaded || fillCanvasBackground) return "";
    switch (imageBackground) {
      case "checkerboard":
        return "bg-(image:--checkerboard-bg) bg-size-[20px_20px]";
      case "average":
        return ""; // Handled via inline style
      default:
        return "bg-background";
    }
  };

  const getImageStyle = () => {
    if (
      loaded &&
      imageBackground === "average" &&
      averageColor &&
      !fillCanvasBackground
    ) {
      return { backgroundColor: averageColor };
    }
    return {};
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        isZoomed && "ring-destructive/60 ring-6 ring-inset",
        getContainerBackgroundClass(),
        // Disable browser pinch zoom
        isTop ? "touch-pan-y" : "",
      )}
      style={getContainerStyle()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleContainerWheel}
    >
      {/* Blurhash placeholder - only while loading */}
      {blurhash && !loaded && (
        <BlurhashCanvas
          blurhash={blurhash}
          className="absolute inset-0 h-full w-full"
        />
      )}

      <motion.img
        ref={imageRef}
        src={fileUrl}
        alt={`File ${fileId}`}
        decoding="async"
        fetchPriority={isTop ? "high" : "low"}
        draggable={false}
        drag={isTop && isZoomed}
        dragConstraints={dragConstraints}
        dragElastic={0.3}
        dragTransition={{ power: 0.3, timeConstant: 200 }}
        dragMomentum={true}
        onDragStart={() => {
          setIsDragging(true);
          hasDragged.current = false;
        }}
        onDrag={() => {
          hasDragged.current = true;
        }}
        onDragEnd={() => {
          setIsDragging(false);
          setTimeout(() => {
            hasDragged.current = false;
          }, 0);
        }}
        onWheel={handleImageWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onLoad={handleLoad}
        onError={handleError}
        style={
          {
            x: isTop ? dragX : 0,
            y: isTop ? dragY : 0,
            ...getImageStyle(),
            ...(isTop && naturalSize.width > 0
              ? {
                  width: scaledWidth,
                  height: scaledHeight,
                  minWidth: scaledWidth,
                  minHeight: scaledHeight,
                  flexShrink: 0,
                }
              : {
                  width: "auto",
                  height: "auto",
                  minWidth: "auto",
                  minHeight: "auto",
                }),
          } as React.CSSProperties
        }
        className={cn(
          "transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0",
          getImageBackgroundClass(),
          isTop && getCursor(),
          isTop && isZoomed
            ? "max-h-none! max-w-none! touch-none select-none"
            : "max-h-full max-w-full object-contain",
        )}
      />

      {/* Zoom level indicator - positioned at lower third */}
      {isTop && isZooming && !isAtFit && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-1/3 items-end justify-center pb-8">
          <div className="bg-card/90 text-foreground rounded-md px-3 py-2 text-sm font-medium tabular-nums shadow-lg">
            {zoomScale.toFixed(2)}×
          </div>
        </div>
      )}
    </div>
  );
}
