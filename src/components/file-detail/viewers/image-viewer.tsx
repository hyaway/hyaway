import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconMaximize,
  IconMinimize,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { viewerFixedHeight, viewerMinHeight } from "./style-constants";
import { cn } from "@/lib/utils";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import {
  useFileViewerStartExpanded,
  useFillCanvasBackground,
  useImageBackground,
} from "@/stores/file-viewer-settings-store";
import { Toggle } from "@/components/ui-primitives/toggle";

// Tolerance for matching fit/1x scale values (±3%)
const SCALE_TOLERANCE = 0.03;
// Max zoom bound
const MAX_ZOOM = 4.0;
// Scroll wheel zoom: each 100 deltaY units = 10% zoom change
const WHEEL_ZOOM_STEP = 0.001;

interface ImageViewerProps {
  fileUrl: string;
  fileId: number;
  blurhash?: string;
  onLoad: () => void;
  onError: () => void;
}

export function ImageViewer({
  fileUrl,
  fileId,
  blurhash,
  onLoad,
  onError,
}: ImageViewerProps) {
  const startExpanded = useFileViewerStartExpanded();
  // Overlay mode: theater or fullscreen (null = normal view)
  const [overlayMode, setOverlayMode] = useState<
    "theater" | "fullscreen" | null
  >(null);

  // Non-pan mode zoom: fit or 1x toggle (independent of pan mode)
  type NormalZoomLevel = "fit" | "1x";
  const [normalZoomLevel, setNormalZoomLevel] = useState<NormalZoomLevel>(
    startExpanded ? "1x" : "fit",
  );

  // Pan mode: zoom can be "fit" (follows fitScale) or a specific numeric scale
  // Using "fit" as a marker avoids sync issues when container resizes
  const [zoomMode, setZoomMode] = useState<"fit" | number>("fit");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Track if user is actively zooming (for showing indicator)
  const [isZooming, setIsZooming] = useState(false);
  const zoomTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Track last tap target for alternating fit/1x
  const lastTapTargetRef = useRef<"fit" | "1x">("fit");

  const [loaded, setLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const imageBackground = useImageBackground();
  const fillCanvasBackground = useFillCanvasBackground();

  // Framer Motion values for pan and zoom (using motion values ensures synchronous updates)
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const scaleMotion = useMotionValue(1);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const isFullscreen = overlayMode === "fullscreen";
  const isTheater = overlayMode === "theater";
  const isPannable = isFullscreen || isTheater;
  const isExpanded = normalZoomLevel !== "fit"; // For non-pan mode backward compatibility
  const [isBottomVisible, setIsBottomVisible] = useState(true);
  const [isInView, setIsInView] = useState(true);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  // Calculate fit scale (how much to scale image to fit container)
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
    return Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1x
  }, [naturalSize, containerSize]);

  // Actual zoom scale used for rendering (computed after fitScale)
  const zoomScale = zoomMode === "fit" ? fitScale : zoomMode;

  // Sync motion value with computed scale (for non-continuous updates like fit mode)
  useEffect(() => {
    scaleMotion.set(zoomScale);
  }, [zoomScale, scaleMotion]);

  // Derived motion values for image dimensions (update synchronously with scale)
  const imageWidth = useTransform(scaleMotion, (s) => naturalSize.width * s);
  const imageHeight = useTransform(scaleMotion, (s) => naturalSize.height * s);

  // Min zoom is fit scale
  const minZoom = fitScale;

  // Check if current scale matches fit or 1x (within tolerance)
  const isAtFit =
    zoomMode === "fit" || Math.abs(zoomScale - fitScale) <= SCALE_TOLERANCE;
  const isAt1x = Math.abs(zoomScale - 1.0) <= SCALE_TOLERANCE;

  const averageColor = useMemo(
    () => getAverageColorFromBlurhash(blurhash),
    [blurhash],
  );

  // Track container size for fitScale calculation
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
  }, [isPannable]);

  const handleLoad = () => {
    setLoaded(true);
    if (imageRef.current) {
      setNaturalSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
    onLoad();
  };

  // Enter fullscreen mode
  const enterFullscreen = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen();
      setOverlayMode("fullscreen");
      // Reset to fit when entering pan mode
      setZoomMode("fit");
      lastTapTargetRef.current = "fit";
      dragX.stop();
      dragY.stop();
      dragX.set(0);
      dragY.set(0);
    }
  }, [dragX, dragY]);

  // Exit fullscreen mode
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setOverlayMode(null);
    dragX.stop();
    dragY.stop();
    dragX.set(0);
    dragY.set(0);
  }, [dragX, dragY]);

  // Toggle theater mode (full browser viewport)
  const toggleTheater = useCallback(() => {
    if (isTheater) {
      setOverlayMode(null);
      dragX.stop();
      dragY.stop();
      dragX.set(0);
      dragY.set(0);
    } else {
      setOverlayMode("theater");
      // Reset to fit when entering pan mode
      setZoomMode("fit");
      lastTapTargetRef.current = "fit";
      dragX.stop();
      dragY.stop();
      dragX.set(0);
      dragY.set(0);
    }
  }, [isTheater, dragX, dragY]);

  // Toggle normal mode zoom (fit ↔ 1x)
  const toggleNormalZoom = useCallback(() => {
    setNormalZoomLevel((prev) => {
      const next = prev === "fit" ? "1x" : "fit";
      if (next === "fit") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      return next;
    });
  }, []);

  // Toggle pan mode zoom (cycles fit → 1x → fit)
  const togglePanZoom = useCallback(() => {
    // Always alternate between fit and 1x
    const targetMode: "fit" | number =
      lastTapTargetRef.current === "fit" ? 1.0 : "fit";
    const nextTarget = lastTapTargetRef.current === "fit" ? "1x" : "fit";

    setZoomMode(targetMode);
    lastTapTargetRef.current = nextTarget;
    dragX.set(0);
    dragY.set(0);
  }, [dragX, dragY]);

  // Set specific zoom scale in pan mode
  const setZoomToScale = useCallback(
    (mode: "fit" | number, target: "fit" | "1x") => {
      setZoomMode(mode);
      lastTapTargetRef.current = target === "fit" ? "1x" : "fit"; // Next tap will go to opposite
      dragX.set(0);
      dragY.set(0);
    },
    [dragX, dragY],
  );

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

  // Adjust zoom with cursor/touch anchoring
  const adjustZoom = useCallback(
    (delta: number, anchorX: number, anchorY: number) => {
      const container = containerRef.current;
      if (!container || naturalSize.width === 0) return;

      const containerRect = container.getBoundingClientRect();
      const currentScale = zoomScale;
      let newScale = Math.max(
        minZoom,
        Math.min(MAX_ZOOM, currentScale + delta),
      );

      if (newScale === currentScale) return;

      // If we hit the minimum zoom (only when zooming out), snap to fit mode
      if (delta < 0 && newScale <= minZoom + SCALE_TOLERANCE) {
        setZoomMode("fit");
        dragX.set(0);
        dragY.set(0);
        showZoomIndicator();
        return;
      }

      // Snap to 1x when crossing through it (not when leaving it)
      const crossingToOneFromBelow =
        delta > 0 && currentScale < 1.0 && newScale >= 1.0 - SCALE_TOLERANCE;
      const crossingToOneFromAbove =
        delta < 0 && currentScale > 1.0 && newScale <= 1.0 + SCALE_TOLERANCE;
      if (crossingToOneFromBelow || crossingToOneFromAbove) {
        newScale = 1.0;
      }

      // Get new image dimensions at new zoom level
      const newWidth = naturalSize.width * newScale;
      const newHeight = naturalSize.height * newScale;

      // Calculate max pan bounds for new scale
      const maxPanX = Math.max(0, (newWidth - containerRect.width) / 2);
      const maxPanY = Math.max(0, (newHeight - containerRect.height) / 2);

      let newDragX = 0;
      let newDragY = 0;

      // Only do anchor-based positioning if image is larger than container
      // (i.e., there's actually room to pan)
      if (maxPanX > 0 || maxPanY > 0) {
        // Anchor point relative to container center
        const anchorFromCenterX = anchorX - containerRect.width / 2;
        const anchorFromCenterY = anchorY - containerRect.height / 2;

        // Current position of anchor in image space
        const currentDragX = dragX.get();
        const currentDragY = dragY.get();

        // Point in image at anchor (relative to image center)
        const imagePointX = anchorFromCenterX - currentDragX;
        const imagePointY = anchorFromCenterY - currentDragY;

        // Scale factor
        const scaleFactor = newScale / currentScale;

        // New position of that point after scaling
        const newImagePointX = imagePointX * scaleFactor;
        const newImagePointY = imagePointY * scaleFactor;

        // New drag position to keep anchor point stationary
        newDragX = anchorFromCenterX - newImagePointX;
        newDragY = anchorFromCenterY - newImagePointY;

        // Clamp to bounds
        newDragX = Math.max(-maxPanX, Math.min(maxPanX, newDragX));
        newDragY = Math.max(-maxPanY, Math.min(maxPanY, newDragY));
      }

      // Update motion values synchronously (all in same frame)
      scaleMotion.set(newScale);
      dragX.set(newDragX);
      dragY.set(newDragY);
      // Update React state (for UI like button highlights)
      setZoomMode(newScale);
      showZoomIndicator();
    },
    [
      zoomScale,
      minZoom,
      naturalSize,
      dragX,
      dragY,
      scaleMotion,
      showZoomIndicator,
    ],
  );

  // Wheel zoom handler for image (anchors to cursor position)
  const handleImageWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isPannable) return;

      e.preventDefault();
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Multiplicative zoom: scroll applies percentage change
      const factor = Math.pow(1.1, -e.deltaY * WHEEL_ZOOM_STEP * 10);
      const delta = zoomScale * factor - zoomScale;

      // Anchor to cursor position over image
      const anchorX = e.clientX - rect.left;
      const anchorY = e.clientY - rect.top;

      adjustZoom(delta, anchorX, anchorY);
    },
    [isPannable, zoomScale, adjustZoom],
  );

  // Wheel zoom handler for container (anchors to closest edge of image)
  const handleContainerWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isPannable) return;

      e.preventDefault();
      const containerRect = containerRef.current?.getBoundingClientRect();
      const imageRect = imageRef.current?.getBoundingClientRect();
      if (!containerRect || !imageRect) return;

      // Multiplicative zoom: scroll applies percentage change
      const factor = Math.pow(1.1, -e.deltaY * WHEEL_ZOOM_STEP * 10);
      const delta = zoomScale * factor - zoomScale;

      // Cursor position in container space
      const cursorX = e.clientX - containerRect.left;
      const cursorY = e.clientY - containerRect.top;

      // Image bounds in container space
      const imgLeft = imageRect.left - containerRect.left;
      const imgRight = imageRect.right - containerRect.left;
      const imgTop = imageRect.top - containerRect.top;
      const imgBottom = imageRect.bottom - containerRect.top;

      // Clamp cursor to closest point on image edge
      const anchorX = Math.max(imgLeft, Math.min(imgRight, cursorX));
      const anchorY = Math.max(imgTop, Math.min(imgBottom, cursorY));

      adjustZoom(delta, anchorX, anchorY);
    },
    [isPannable, zoomScale, adjustZoom],
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
      if (!isPannable || e.touches.length !== 2) return;

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
    [isPannable, zoomScale],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPannable || e.touches.length !== 2 || !pinchStateRef.current)
        return;

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

      // Use multiplicative ratio for natural pinch feel (fingers 2x apart = 2x zoom)
      const scaleRatio = distance / initialDistance;
      const newScale = Math.max(
        minZoom,
        Math.min(MAX_ZOOM, initialScale * scaleRatio),
      );

      // Update pinch center for current touches
      const newCenterX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
      const newCenterY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

      // Use average of initial and current center
      const anchorX = (centerX + newCenterX) / 2;
      const anchorY = (centerY + newCenterY) / 2;

      const delta = newScale - zoomScale;
      if (Math.abs(delta) > 0.001) {
        adjustZoom(delta, anchorX, anchorY);
      }
    },
    [isPannable, minZoom, zoomScale, adjustZoom],
  );

  const handleTouchEnd = useCallback(() => {
    pinchStateRef.current = null;
  }, []);

  // Track if container is in viewport and if bottom is visible
  useEffect(() => {
    const container = containerRef.current;
    const bottomSentinel = bottomSentinelRef.current;
    if (!container || !bottomSentinel) return;

    const containerObserver = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    const bottomObserver = new IntersectionObserver(
      ([entry]) => {
        setIsBottomVisible(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    containerObserver.observe(container);
    bottomObserver.observe(bottomSentinel);
    return () => {
      containerObserver.disconnect();
      bottomObserver.disconnect();
    };
  }, []);

  // Listen for fullscreen change (e.g., user presses Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && overlayMode === "fullscreen") {
        setOverlayMode(null);
        dragX.stop();
        dragY.stop();
        dragX.set(0);
        dragY.set(0);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [overlayMode, dragX, dragY]);

  // Escape key exits theater mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTheater) {
        setOverlayMode(null);
        dragX.stop();
        dragY.stop();
        dragX.set(0);
        dragY.set(0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTheater, dragX, dragY]);

  // Disable body scroll in theater mode
  useEffect(() => {
    if (isTheater) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isTheater]);

  // Determine background style based on setting (for the image element)
  const getBackgroundClass = () => {
    if (!loaded) return "bg-background";
    // When fill canvas is enabled, image has transparent bg so container shows through
    if (fillCanvasBackground) return "";
    switch (imageBackground) {
      case "checkerboard":
        return "bg-(image:--checkerboard-bg) bg-size-[20px_20px]";
      case "average":
        return ""; // Handled via inline style
      default:
        return "bg-background";
    }
  };

  // Click handler for container - toggle zoom (both pan and normal modes)
  const handleContainerClick = (e: React.MouseEvent) => {
    if (hasDragged.current) return;
    // Ignore clicks on control buttons
    if ((e.target as HTMLElement).closest("button")) return;

    if (isPannable) {
      // Single click: cycle between fit and 1x
      if (e.detail === 1) {
        togglePanZoom();
      }
      // Double-click: exit fullscreen/theater
      if (e.detail === 2) {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          setOverlayMode(null);
          dragX.stop();
          dragY.stop();
          dragX.set(0);
          dragY.set(0);
        }
      }
    } else {
      // Normal mode: toggle expand
      toggleNormalZoom();
    }
  };

  // Get cursor based on mode (for container - zoom cursors only)
  const getCursor = () => {
    if (isPannable) {
      // In pan mode, container shows zoom cursor for tap behavior
      return isAtFit ? "cursor-zoom-in" : "cursor-zoom-out";
    }
    return isExpanded ? "cursor-zoom-out" : "cursor-zoom-in";
  };

  // Get cursor for image (grab cursor in pan mode)
  const getImageCursor = () => {
    if (isPannable) {
      return isDragging ? "cursor-grabbing" : "cursor-grab";
    }
    return ""; // Inherit from container
  };

  // Get container classes based on view mode
  const getContainerClass = () => {
    // Skip default bg classes when fill canvas is active
    const useFillBg = fillCanvasBackground && loaded;

    if (overlayMode === "theater") {
      return cn("fixed inset-0 z-50", !useFillBg && "bg-black/95");
    }
    if (overlayMode === "fullscreen") {
      return cn("h-screen w-screen", !useFillBg && "bg-black");
    }
    return isExpanded ? viewerMinHeight : viewerFixedHeight;
  };

  // Get container background class (for fill canvas option)
  const getContainerBackgroundClass = () => {
    if (!fillCanvasBackground || !loaded) return "";
    switch (imageBackground) {
      case "checkerboard":
        return "bg-(image:--checkerboard-bg) bg-size-[20px_20px]";
      case "solid":
        return "bg-background";
      case "average":
        return ""; // Handled via inline style
      default:
        return "";
    }
  };

  // Get container background style (for fill canvas with average color)
  const getContainerStyle = () => {
    if (
      fillCanvasBackground &&
      imageBackground === "average" &&
      averageColor &&
      loaded
    ) {
      // In theater mode, add slight transparency to match the /95 aesthetic
      if (isTheater) {
        return { backgroundColor: averageColor + "f2" }; // f2 = ~95% opacity
      }
      return { backgroundColor: averageColor };
    }
    return {};
  };

  return (
    <div
      ref={containerRef}
      style={getContainerStyle()}
      className={cn(
        "group relative flex items-center justify-center overflow-hidden",
        getContainerClass(),
        getContainerBackgroundClass(),
        getCursor(),
        // Disable browser touch gestures (zoom, scroll) in pan mode
        isPannable && "touch-none",
      )}
      // Handle touch events on container to prevent browser zoom outside image
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      // Handle scroll wheel zoom on container in pan mode
      onWheel={handleContainerWheel}
      // Handle clicks on container in pan mode
      onClick={handleContainerClick}
    >
      <motion.img
        ref={imageRef}
        src={fileUrl}
        alt={`File ${fileId}`}
        loading="eager"
        draggable={false}
        drag={isPannable}
        dragConstraints={containerRef}
        dragElastic={0.5}
        dragTransition={{ power: 0.3, timeConstant: 200 }}
        whileDrag={{ scale: 0.98 }}
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
        style={
          {
            x: isPannable ? dragX : 0,
            y: isPannable ? dragY : 0,
            // Only apply average color to image when fill canvas is disabled
            ...(loaded &&
            imageBackground === "average" &&
            averageColor &&
            !fillCanvasBackground
              ? { backgroundColor: averageColor }
              : {}),
            // In pan mode, use motion values for synchronous updates
            // In normal mode, explicitly unset to allow CSS to control sizing
            ...(isPannable && naturalSize.width > 0
              ? {
                  width: imageWidth,
                  height: imageHeight,
                  minWidth: imageWidth,
                  minHeight: imageHeight,
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
          getBackgroundClass(),
          getImageCursor(),
          isPannable
            ? "max-h-none! max-w-none! touch-none select-none" // Pan mode: no constraints, disable browser gestures
            : "max-h-full max-w-full object-contain", // Normal: fit container
        )}
        onLoad={handleLoad}
        onError={onError}
      />

      {/* Bottom sentinel for tracking when bottom of container is visible */}
      <div
        ref={bottomSentinelRef}
        className="absolute right-0 bottom-0 h-px w-px"
      />

      {/* Zoom level indicator - lower third, shows when actively zooming */}
      {isPannable && isZooming && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center pb-[15vh]">
          <div className="bg-card/90 text-foreground rounded-md px-3 py-2 text-sm font-medium tabular-nums shadow-lg">
            {zoomScale.toFixed(2)}×
          </div>
        </div>
      )}

      {/* Control buttons - fixed when scrolling, absolute when bottom visible */}
      {loaded && isInView && (
        <div
          className={cn(
            "bottom-4 z-50 flex gap-1 opacity-50 transition-opacity hover:opacity-100",
            isPannable
              ? "fixed right-4"
              : isBottomVisible
                ? "short:bottom-8 absolute right-0"
                : cn(
                    "fixed right-6",
                    "short:bottom-[calc(var(--footer-height-short)+1rem)] bottom-[calc(var(--footer-height)+1rem)] sm:bottom-[calc(var(--footer-height-sm)+1rem)]",
                  ),
          )}
        >
          {/* Pan mode controls */}
          {isPannable && (
            <>
              {/* 1. Fit to screen */}
              <Toggle
                variant="outline"
                size="sm"
                className="bg-card"
                pressed={isAtFit}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomToScale("fit", "fit");
                }}
                title="Fit to screen"
              >
                <IconZoomOut className="size-4" />
              </Toggle>

              {/* 2. 1:1 native size */}
              <Toggle
                variant="outline"
                size="sm"
                className="bg-card"
                pressed={isAt1x}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomToScale(1.0, "1x");
                }}
                title="View 1:1"
              >
                <span className="text-xs font-medium">1×</span>
              </Toggle>

              {/* 3. Theater toggle (on/off or switch from fullscreen) */}
              <Toggle
                variant="outline"
                size="sm"
                className="bg-card"
                pressed={isTheater}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isFullscreen) {
                    // Switch from fullscreen to theater
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    }
                    setOverlayMode("theater");
                    // Reset to fit when switching modes
                    setZoomMode("fit");
                    lastTapTargetRef.current = "fit";
                    dragX.stop();
                    dragY.stop();
                    dragX.set(0);
                    dragY.set(0);
                  } else {
                    // Toggle theater off
                    toggleTheater();
                  }
                }}
                title={isTheater ? "Exit theater" : "Theater mode"}
              >
                {isTheater ? (
                  <IconArrowsMinimize className="size-4" />
                ) : (
                  <IconArrowsMaximize className="size-4" />
                )}
              </Toggle>

              {/* 4. Fullscreen toggle (on/off or switch from theater) */}
              <Toggle
                variant="outline"
                size="sm"
                className="bg-card"
                pressed={isFullscreen}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isFullscreen) {
                    exitFullscreen();
                  } else {
                    // Reset zoom and pan when switching modes
                    setZoomMode("fit");
                    lastTapTargetRef.current = "fit";
                    dragX.stop();
                    dragY.stop();
                    dragX.set(0);
                    dragY.set(0);
                    enterFullscreen();
                  }
                }}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <IconMinimize className="size-4" />
                ) : (
                  <IconMaximize className="size-4" />
                )}
              </Toggle>
            </>
          )}

          {/* Normal mode controls */}
          {!isPannable && (
            <>
              {/* 1. Zoom toggle (collapsed ↔ expanded) */}
              <Toggle
                variant="outline"
                size="sm"
                className="bg-card"
                pressed={isExpanded}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNormalZoom();
                }}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <IconZoomOut className="size-4" />
                ) : (
                  <IconZoomIn className="size-4" />
                )}
              </Toggle>

              {/* 2. Theater mode */}
              <Toggle
                variant="outline"
                size="sm"
                className="bg-card"
                pressed={false}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTheater();
                }}
                title="Theater mode"
              >
                <IconArrowsMaximize className="size-4" />
              </Toggle>

              {/* 3. Fullscreen */}
              <Toggle
                variant="outline"
                size="sm"
                className="bg-card"
                pressed={false}
                onClick={(e) => {
                  e.stopPropagation();
                  enterFullscreen();
                }}
                title="Fullscreen"
              >
                <IconMaximize className="size-4" />
              </Toggle>
            </>
          )}
        </div>
      )}
    </div>
  );
}
