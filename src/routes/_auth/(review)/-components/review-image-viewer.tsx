import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconPhoto, IconPhotoScan } from "@tabler/icons-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import type { ReviewImageLoadMode } from "@/stores/review-queue-store";
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
import { Toggle } from "@/components/ui-primitives/toggle";

// Tolerance for matching fit scale (±2%)
const SCALE_TOLERANCE = 0.02;
// Max zoom bound
const MAX_ZOOM = 4.0;
// Scroll wheel zoom sensitivity
const WHEEL_ZOOM_STEP = 0.001;
// File size threshold for optimization (5MB)
const FILE_SIZE_THRESHOLD = 5 * 1024 * 1024;
// Minimum visible size for the image (prevents pinching it into near-zero pixels)
const MIN_IMAGE_DIMENSION_PX = 48;
// Ignore degenerate pinch samples; prevents huge jumps when two pointers briefly
// report the same position (distance ~ 0) during fast pinches.
const MIN_PINCH_DISTANCE_PX = 16;
// Only allow panning when there is meaningful room to pan.
// This avoids jitter and accidental micro-pans when near fit.
const PAN_ENABLE_THRESHOLD_PX = 40;

interface ReviewImageViewerProps {
  fileId: number;
  mime: string;
  width: number | null;
  height: number | null;
  size: number | null;
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
  size: fileSize,
  numFrames,
  blurhash,
  onLoad,
  onError,
  isTop = false,
}: ReviewImageViewerProps) {
  const globalImageLoadMode = useReviewImageLoadMode();
  const imageBackground = useImageBackground();
  const fillCanvasBackground = useFillCanvasBackground();

  // Check if this mime type is a static image or image project file
  const staticImage = isStaticImage(mime);
  const imageProjectFile = isImageProjectFile(mime);
  const isAnimated = (numFrames ?? 0) > 1;

  // Check if optimization is available for this image (static, not animated, large file)
  // Only use file size - dimension checks would flag tall comic strips unnecessarily
  const canOptimize = useMemo(() => {
    if (!staticImage || isAnimated || imageProjectFile) return false;
    if (fileSize == null) return false;

    return fileSize > FILE_SIZE_THRESHOLD;
  }, [staticImage, isAnimated, imageProjectFile, fileSize]);

  // Local state for load mode - initialized from global setting, can be toggled per-image
  const [localLoadMode, setLocalLoadMode] = useState<ReviewImageLoadMode>(
    () => globalImageLoadMode,
  );

  // Sync local state when global setting changes (but only on mount or when global changes)
  useEffect(() => {
    setLocalLoadMode((prev) =>
      prev === globalImageLoadMode ? prev : globalImageLoadMode,
    );
  }, [globalImageLoadMode]);

  // Compute average color from blurhash for backgrounds
  const averageColor = useMemo(
    () => getAverageColorFromBlurhash(blurhash ?? undefined),
    [blurhash],
  );

  // Calculate render dimensions for "optimized" mode - preserve aspect ratio within screen bounds
  const renderDimensions = useMemo(() => {
    if (localLoadMode !== "optimized") return undefined;
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
  }, [localLoadMode, metadataWidth, metadataHeight]);

  // Determine render dimensions:
  // - For "optimized" mode: fit to screen
  // - For "original" mode with project files: use full metadata dimensions
  const projectFileFullDimensions =
    imageProjectFile &&
    localLoadMode === "original" &&
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
  // - Static images use render when "optimized" mode enabled AND optimization is available
  const useRenderedImage =
    imageProjectFile ||
    (canOptimize &&
      localLoadMode === "optimized" &&
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

  // Counter to trigger mode indicator animation (increments on each toggle)
  const [modeToggleCount, setModeToggleCount] = useState(0);

  // Zoom state: "fit" follows fitScale, number is explicit scale
  const [zoomMode, setZoomMode] = useState<"fit" | number>("fit");

  // Avoid rerendering at raw wheel/pinch event frequency by batching zoomMode updates.
  const pendingZoomModeRef = useRef<number | null>(null);
  const zoomModeRafRef = useRef<number | null>(null);
  const scheduleZoomMode = useCallback((nextScale: number) => {
    pendingZoomModeRef.current = nextScale;
    if (zoomModeRafRef.current != null) return;

    zoomModeRafRef.current = requestAnimationFrame(() => {
      zoomModeRafRef.current = null;
      const pending = pendingZoomModeRef.current;
      pendingZoomModeRef.current = null;
      if (pending == null) return;
      setZoomMode(pending);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (zoomModeRafRef.current != null) {
        cancelAnimationFrame(zoomModeRafRef.current);
      }
    };
  }, []);

  // Framer Motion values for pan and zoom
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const scaleMotion = useMotionValue(1);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Pointer-based pinch zoom state (more reliable than TouchEvent + preventDefault)
  const activeTouchPointersRef = useRef(
    new Map<number, { x: number; y: number }>(),
  );
  const isPinchingRef = useRef(false);
  const [isPinching, setIsPinching] = useState(false);
  const pinchStateRef = useRef<{
    initialDistance: number;
    initialScale: number;
  } | null>(null);

  // Pending zoom state to restore after mode switch (optimized <-> original)
  const pendingZoomRestoreRef = useRef<{
    zoomMode: "fit" | number;
    dragX: number;
    dragY: number;
    naturalWidth: number;
  } | null>(null);

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

  // Min zoom: fit scale, with a hard minimum visible size so the image can't
  // be pinched into (almost) nothing.
  const minZoom = useMemo(() => {
    if (naturalSize.width === 0 || naturalSize.height === 0) return fitScale;

    // Don't force upscaling for small images.
    const minScaleForPixels = Math.min(
      1,
      Math.max(
        MIN_IMAGE_DIMENSION_PX / naturalSize.width,
        MIN_IMAGE_DIMENSION_PX / naturalSize.height,
      ),
    );

    return Math.max(fitScale, minScaleForPixels);
  }, [fitScale, naturalSize]);

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

    // Only allow panning when the image is larger than the container.
    // Allowing pan when smaller causes drift/jitter near "fit".
    const maxPanXRaw = Math.max(0, (imgWidth - containerSize.width) / 2);
    const maxPanYRaw = Math.max(0, (imgHeight - containerSize.height) / 2);
    const maxPanX = maxPanXRaw <= PAN_ENABLE_THRESHOLD_PX ? 0 : maxPanXRaw;
    const maxPanY = maxPanYRaw <= PAN_ENABLE_THRESHOLD_PX ? 0 : maxPanYRaw;

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
      const newWidth = imageRef.current.naturalWidth;
      const newHeight = imageRef.current.naturalHeight;
      setNaturalSize({ width: newWidth, height: newHeight });

      // Restore zoom state after mode switch (optimized <-> original)
      const pending = pendingZoomRestoreRef.current;
      if (pending && newWidth > 0) {
        if (pending.naturalWidth !== newWidth) {
          const sizeRatio = pending.naturalWidth / newWidth;

          if (pending.zoomMode === "fit") {
            // Stay in fit mode
            setZoomMode("fit");
            dragX.set(0);
            dragY.set(0);
          } else {
            // Adjust zoom to maintain same visual size
            // If old image was 1000px at 2x zoom (2000px display)
            // and new image is 4000px, we need 0.5x zoom (2000px display)
            const newZoomScale = pending.zoomMode * sizeRatio;
            setZoomMode(newZoomScale);
            scaleMotion.set(newZoomScale);
            // Pan stays the same since we maintain same visual size
            dragX.set(pending.dragX);
            dragY.set(pending.dragY);
          }
        }
        // Always clear once we've had a successful load, so we don't restore
        // against an unrelated future image load.
        pendingZoomRestoreRef.current = null;
      }
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

  // Prevent setState after unmount
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  const smoothCenterImage = useCallback(() => {
    dragX.stop();
    dragY.stop();
    animate(dragX, 0, { type: "tween", duration: 0.12, ease: "easeOut" });
    animate(dragY, 0, { type: "tween", duration: 0.12, ease: "easeOut" });
    setIsDragging(false);
  }, [dragX, dragY]);

  // Keep image centered whenever we return to fit mode
  useEffect(() => {
    if (zoomMode === "fit") {
      smoothCenterImage();
    }
  }, [zoomMode, smoothCenterImage]);

  // If the container/image geometry changes (resize, mode switch) we may end up
  // with a numeric zoomMode that is now outside the new valid range.
  // Clamp scale deterministically to keep the image visible and within bounds.
  useEffect(() => {
    if (!isTop) return;
    if (isDragging || isPinching) return;
    if (naturalSize.width === 0 || naturalSize.height === 0) return;
    if (containerSize.width === 0 || containerSize.height === 0) return;

    const currentScale = scaleMotion.get();
    const shouldClampUp = currentScale < minZoom - SCALE_TOLERANCE;
    const shouldClampDown = currentScale > MAX_ZOOM + SCALE_TOLERANCE;
    if (!shouldClampUp && !shouldClampDown) return;

    const nextScale = shouldClampUp
      ? minZoom
      : Math.min(MAX_ZOOM, Math.max(minZoom, currentScale));
    const snapsToFit = Math.abs(nextScale - fitScale) <= SCALE_TOLERANCE;

    dragX.stop();
    dragY.stop();
    scaleMotion.set(snapsToFit ? fitScale : nextScale);

    if (snapsToFit) {
      setZoomMode("fit");
      dragX.set(0);
      dragY.set(0);
      showZoomIndicator();
      return;
    }

    scheduleZoomMode(nextScale);

    const snappedWidth = naturalSize.width * nextScale;
    const snappedHeight = naturalSize.height * nextScale;

    const EPSILON_PX = 0.5;
    const maxPanXRaw = Math.max(0, (snappedWidth - containerSize.width) / 2);
    const maxPanYRaw = Math.max(0, (snappedHeight - containerSize.height) / 2);
    const maxPanX = maxPanXRaw <= EPSILON_PX ? 0 : maxPanXRaw;
    const maxPanY = maxPanYRaw <= EPSILON_PX ? 0 : maxPanYRaw;

    dragX.set(Math.max(-maxPanX, Math.min(maxPanX, dragX.get())));
    dragY.set(Math.max(-maxPanY, Math.min(maxPanY, dragY.get())));
    showZoomIndicator();
  }, [
    isTop,
    isDragging,
    isPinching,
    naturalSize.width,
    naturalSize.height,
    containerSize.width,
    containerSize.height,
    minZoom,
    fitScale,
    dragX,
    dragY,
    scaleMotion,
    scheduleZoomMode,
    showZoomIndicator,
  ]);

  // Clamp pan whenever bounds change (e.g. resize, zoom changes, mode switches).
  // This keeps the image from being left out-of-bounds, which can otherwise cause
  // jumpy corrections when the next interaction occurs.
  useEffect(() => {
    if (!isTop) return;
    if (isDragging || isPinching) return;

    const maxPanXRaw = Math.max(
      0,
      (naturalSize.width * zoomScale - containerSize.width) / 2,
    );
    const maxPanYRaw = Math.max(
      0,
      (naturalSize.height * zoomScale - containerSize.height) / 2,
    );
    const maxPanX = maxPanXRaw <= PAN_ENABLE_THRESHOLD_PX ? 0 : maxPanXRaw;
    const maxPanY = maxPanYRaw <= PAN_ENABLE_THRESHOLD_PX ? 0 : maxPanYRaw;

    dragX.stop();
    dragY.stop();
    dragX.set(Math.max(-maxPanX, Math.min(maxPanX, dragX.get())));
    dragY.set(Math.max(-maxPanY, Math.min(maxPanY, dragY.get())));
  }, [
    isTop,
    isDragging,
    isPinching,
    naturalSize.width,
    naturalSize.height,
    containerSize.width,
    containerSize.height,
    zoomScale,
    dragX,
    dragY,
  ]);

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

      // If we hit minimum zoom (zooming out), snap to the minimum.
      // Avoid spring-centering from an out-of-bounds pan, which can make the
      // image appear to "disappear" and then fly back in.
      if (delta < 0 && newScale <= minZoom + SCALE_TOLERANCE) {
        const snapsToFit = Math.abs(minZoom - fitScale) <= SCALE_TOLERANCE;

        dragX.stop();
        dragY.stop();

        if (snapsToFit) {
          scaleMotion.set(fitScale);
          setZoomMode("fit");
          dragX.set(0);
          dragY.set(0);
        } else {
          // When minZoom > fitScale (e.g. due to a minimum pixel size), clamp to
          // minZoom without switching to fit mode.
          scaleMotion.set(minZoom);
          setZoomMode(minZoom);

          const snappedWidth = naturalSize.width * minZoom;
          const snappedHeight = naturalSize.height * minZoom;
          const maxPanXRaw = Math.max(
            0,
            (snappedWidth - containerRect.width) / 2,
          );
          const maxPanYRaw = Math.max(
            0,
            (snappedHeight - containerRect.height) / 2,
          );
          const maxPanX =
            maxPanXRaw <= PAN_ENABLE_THRESHOLD_PX ? 0 : maxPanXRaw;
          const maxPanY =
            maxPanYRaw <= PAN_ENABLE_THRESHOLD_PX ? 0 : maxPanYRaw;

          dragX.set(Math.max(-maxPanX, Math.min(maxPanX, currentDragX)));
          dragY.set(Math.max(-maxPanY, Math.min(maxPanY, currentDragY)));
        }

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
      scheduleZoomMode(newScale);
      showZoomIndicator();

      // Get new image dimensions
      const newWidth = naturalSize.width * newScale;
      const newHeight = naturalSize.height * newScale;

      // Calculate max pan bounds
      const maxPanXRaw = Math.max(0, (newWidth - containerRect.width) / 2);
      const maxPanYRaw = Math.max(0, (newHeight - containerRect.height) / 2);
      const maxPanX = maxPanXRaw <= PAN_ENABLE_THRESHOLD_PX ? 0 : maxPanXRaw;
      const maxPanY = maxPanYRaw <= PAN_ENABLE_THRESHOLD_PX ? 0 : maxPanYRaw;

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
      scheduleZoomMode,
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

  const setPinching = useCallback((pinching: boolean) => {
    if (isPinchingRef.current === pinching) return;
    isPinchingRef.current = pinching;
    setIsPinching(pinching);
    if (!pinching) {
      pinchStateRef.current = null;
    }
  }, []);

  // Clear any retained pointer state when this card is no longer active.
  useEffect(() => {
    if (isTop) return;
    activeTouchPointersRef.current.clear();
    setPinching(false);
  }, [isTop, setPinching]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isTop) return;
      if (e.pointerType !== "touch") return;

      // With touch-action: none, the browser shouldn't scroll/zoom.
      // preventDefault here is still useful on some browsers.
      e.preventDefault();

      activeTouchPointersRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });

      if (activeTouchPointersRef.current.size >= 2) {
        setPinching(true);

        // Pinch baseline is initialized lazily (once) when we have a meaningful
        // separation between touch points. This avoids a fast-pinch edge case
        // where initialDistance is effectively 0 and causes a jump.
        if (!pinchStateRef.current) {
          const pointerIds = Array.from(activeTouchPointersRef.current.keys());
          pointerIds.sort((a, b) => a - b);
          const p1 = activeTouchPointersRef.current.get(pointerIds[0])!;
          const p2 = activeTouchPointersRef.current.get(pointerIds[1])!;
          const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (Number.isFinite(distance) && distance >= MIN_PINCH_DISTANCE_PX) {
            const initialScale = scaleMotion.get();
            pinchStateRef.current = {
              initialDistance: distance,
              initialScale: Math.max(minZoom, initialScale),
            };
          }
        }

        // Capture both pointers so we keep receiving move/up events even if
        // the browser would otherwise retarget them (or if a parent starts drag).
        const element = e.currentTarget as HTMLElement;
        activeTouchPointersRef.current.forEach((_, pointerId) => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          element.setPointerCapture?.(pointerId);
        });
        // Stop motion-driven dragging state; pinch should "win" over pan.
        setIsDragging(false);
      }
    },
    [isTop, setPinching, minZoom, scaleMotion],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isTop) return;
      if (e.pointerType !== "touch") return;
      if (!activeTouchPointersRef.current.has(e.pointerId)) return;

      e.preventDefault();

      activeTouchPointersRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });

      if (activeTouchPointersRef.current.size < 2) return;

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      // Deterministically select two touch pointers (stable by pointerId)
      const pointerIds = Array.from(activeTouchPointersRef.current.keys());
      pointerIds.sort((a, b) => a - b);
      const p1 = activeTouchPointersRef.current.get(pointerIds[0])!;
      const p2 = activeTouchPointersRef.current.get(pointerIds[1])!;

      const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (!Number.isFinite(distance) || distance < MIN_PINCH_DISTANCE_PX)
        return;

      // Lazily initialize pinch baseline on the first meaningful sample.
      if (!pinchStateRef.current) {
        const initialScale = scaleMotion.get();
        pinchStateRef.current = {
          initialDistance: distance,
          initialScale: Math.max(minZoom, initialScale),
        };
        return;
      }

      const pinchState = pinchStateRef.current;
      if (pinchState.initialDistance <= 0) return;

      const centerX = (p1.x + p2.x) / 2 - containerRect.left;
      const centerY = (p1.y + p2.y) / 2 - containerRect.top;

      const currentScale = scaleMotion.get();

      const scaleRatio = distance / pinchState.initialDistance;
      if (!Number.isFinite(scaleRatio)) return;
      const newScale = Math.max(
        minZoom,
        Math.min(MAX_ZOOM, pinchState.initialScale * scaleRatio),
      );
      const delta = newScale - currentScale;

      if (Math.abs(delta) > 0.0005) {
        // Gestures should not snap to 1x
        adjustZoom(delta, centerX, centerY, false, false);
      }
    },
    [isTop, adjustZoom, minZoom, scaleMotion],
  );

  const handlePointerUpOrCancel = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "touch") return;

      activeTouchPointersRef.current.delete(e.pointerId);

      if (activeTouchPointersRef.current.size < 2) {
        setPinching(false);
      }
    },
    [setPinching],
  );

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
      data-pan-mode={isZoomed || undefined}
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        getContainerBackgroundClass(),
        // Disable browser pinch zoom on the interactive surface.
        // (Also makes pointer-based pinch handling reliable.)
        isTop ? "touch-none" : "",
      )}
      style={getContainerStyle()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onWheel={handleContainerWheel}
    >
      {/* Zoomed mode border overlay - above image */}
      {isZoomed && (
        <div className="ring-destructive/60 pointer-events-none absolute inset-0 z-10 ring-6 ring-inset" />
      )}

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
        drag={isTop && isZoomed && !isPinching}
        dragConstraints={dragConstraints}
        // Keep panning strictly constrained to the image bounds (no overscroll / spring-back).
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => {
          setIsDragging(true);
        }}
        onDragEnd={() => {
          setIsDragging(false);
        }}
        onWheel={handleImageWheel}
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

      {/* Image load mode indicator - shown briefly when toggled */}
      {isTop && modeToggleCount > 0 && (
        <div
          key={modeToggleCount}
          className="animate-out fade-out fill-mode-forwards pointer-events-none absolute inset-x-0 bottom-0 flex h-1/3 items-end justify-center pb-8 delay-700 duration-300"
        >
          <div className="bg-card/90 text-foreground rounded-md px-3 py-2 text-sm font-medium shadow-lg">
            {localLoadMode === "original" ? "Original" : "Optimized"}
          </div>
        </div>
      )}

      {/* Image load mode toggle - only show when optimization is available */}
      {isTop && canOptimize && (
        <div className="absolute bottom-2 left-2">
          <Toggle
            size="sm"
            pressed={localLoadMode === "original"}
            onPressedChange={(pressed) => {
              // Capture current zoom state before switching modes
              pendingZoomRestoreRef.current = {
                zoomMode,
                dragX: dragX.get(),
                dragY: dragY.get(),
                naturalWidth: naturalSize.width,
              };
              setLocalLoadMode(pressed ? "original" : "optimized");
              // Increment to trigger mode indicator animation
              setModeToggleCount((c) => c + 1);
            }}
            aria-label={
              localLoadMode === "original"
                ? "Using original image - click for optimized"
                : "Using optimized image - click for original"
            }
            variant="muted"
            className={"bg-card"}
          >
            <span className="relative">
              {localLoadMode === "original" ? (
                <IconPhoto aria-hidden="true" className="size-4" />
              ) : (
                <IconPhotoScan aria-hidden="true" className="size-4" />
              )}
              {/* Indicator dot when switching to full size would provide more detail */}
              {localLoadMode === "optimized" && zoomScale > 1 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-1.5">
                  <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-primary relative inline-flex size-1.5 rounded-full" />
                </span>
              )}
            </span>
          </Toggle>
        </div>
      )}
    </div>
  );
}
