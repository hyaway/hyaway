import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconMaximize,
  IconMinimize,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import { motion, useMotionValue } from "motion/react";
import { viewerFixedHeight, viewerMinHeight } from "./style-constants";
import { cn } from "@/lib/utils";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import {
  useFileViewerStartExpanded,
  useFillCanvasBackground,
  useImageBackground,
} from "@/stores/file-viewer-settings-store";
import { Toggle } from "@/components/ui-primitives/toggle";

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
  // Zoom level: fit, 1x (native), 2x
  type ZoomLevel = "fit" | "1x" | "2x";
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(
    startExpanded ? "1x" : "fit",
  );
  const [loaded, setLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const imageBackground = useImageBackground();
  const fillCanvasBackground = useFillCanvasBackground();

  // Framer Motion drag state
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const isFullscreen = overlayMode === "fullscreen";
  const isTheater = overlayMode === "theater";
  const isPannable = isFullscreen || isTheater;
  const isExpanded = zoomLevel !== "fit"; // For backward compatibility
  const [isBottomVisible, setIsBottomVisible] = useState(true);
  const [isInView, setIsInView] = useState(true);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  const averageColor = useMemo(
    () => getAverageColorFromBlurhash(blurhash),
    [blurhash],
  );

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
    dragX.set(0);
    dragY.set(0);
  }, [dragX, dragY]);

  // Toggle theater mode (full browser viewport)
  const toggleTheater = useCallback(() => {
    if (isTheater) {
      setOverlayMode(null);
      dragX.set(0);
      dragY.set(0);
    } else {
      setOverlayMode("theater");
      dragX.set(0);
      dragY.set(0);
    }
  }, [isTheater, dragX, dragY]);

  // Cycle zoom: fit → 1x → 2x → fit, with optional click position for zoom-to-point
  const toggleZoom = useCallback(
    (clickPos?: { x: number; y: number }) => {
      setZoomLevel((prev) => {
        const cycle: Array<ZoomLevel> = ["fit", "1x", "2x"];
        const currentIndex = cycle.indexOf(prev);
        const next = cycle[(currentIndex + 1) % cycle.length];

        if (next === "fit") {
          // Reset pan when going back to fit
          if (!isPannable) {
            window.scrollTo({ top: 0, behavior: "auto" });
          }
          dragX.set(0);
          dragY.set(0);
        } else if (clickPos && containerRef.current && naturalSize.width > 0) {
          // Zoom to clicked point
          const container = containerRef.current.getBoundingClientRect();
          const containerCenterX = container.width / 2;
          const containerCenterY = container.height / 2;

          // Click offset from container center
          const clickOffsetX = clickPos.x - containerCenterX;
          const clickOffsetY = clickPos.y - containerCenterY;

          // Get zoom multipliers
          const prevZoom = prev === "fit" ? 0 : prev === "1x" ? 1 : 2;
          const nextZoom = next === "1x" ? 1 : 2;

          // Current pan offset
          const currentPanX = dragX.get();
          const currentPanY = dragY.get();

          // Calculate new image dimensions at next zoom level
          const nextWidth = naturalSize.width * nextZoom;
          const nextHeight = naturalSize.height * nextZoom;

          // Calculate bounds (how far the image can pan)
          const maxPanX = Math.max(0, (nextWidth - container.width) / 2);
          const maxPanY = Math.max(0, (nextHeight - container.height) / 2);

          let newPanX: number;
          let newPanY: number;

          if (prev === "fit") {
            // Zooming from fit: calculate where clicked point is in the fit image
            // and offset to center that point
            const fitScale = Math.min(
              container.width / naturalSize.width,
              container.height / naturalSize.height,
            );
            const naturalClickX = clickOffsetX / fitScale;
            const naturalClickY = clickOffsetY / fitScale;

            // Pan to center the clicked point
            newPanX = -naturalClickX * nextZoom;
            newPanY = -naturalClickY * nextZoom;
          } else {
            // Zooming between 1x and 2x: scale the pan and offset
            const scale = nextZoom / prevZoom;
            newPanX = currentPanX * scale - clickOffsetX * (scale - 1);
            newPanY = currentPanY * scale - clickOffsetY * (scale - 1);
          }

          // Clamp to bounds
          dragX.set(Math.max(-maxPanX, Math.min(maxPanX, newPanX)));
          dragY.set(Math.max(-maxPanY, Math.min(maxPanY, newPanY)));
        } else {
          // No click position, just reset
          dragX.set(0);
          dragY.set(0);
        }

        return next;
      });
    },
    [isPannable, dragX, dragY, naturalSize],
  );

  // Set specific zoom level
  const setZoom = useCallback(
    (level: ZoomLevel) => {
      setZoomLevel(level);
      dragX.set(0);
      dragY.set(0);
    },
    [dragX, dragY],
  );

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

  // Click handler - toggle zoom, or double-click exits fullscreen/theater
  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current) return;

    // Get click position relative to container
    const rect = containerRef.current?.getBoundingClientRect();
    const clickPos = rect
      ? { x: e.clientX - rect.left, y: e.clientY - rect.top }
      : undefined;

    if (isPannable) {
      // Single click: toggle zoom with zoom-to-point
      if (e.detail === 1) {
        toggleZoom(clickPos);
      }
      // Double-click: exit fullscreen/theater
      if (e.detail === 2) {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          setOverlayMode(null);
          dragX.set(0);
          dragY.set(0);
        }
      }
    } else {
      toggleZoom();
    }
  };

  // Get cursor based on mode
  const getCursor = () => {
    if (isPannable) {
      return isDragging ? "cursor-grabbing" : "cursor-grab";
    }
    return isExpanded ? "cursor-zoom-out" : "cursor-zoom-in";
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
      )}
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
        style={{
          x: dragX,
          y: dragY,
          // Only apply average color to image when fill canvas is disabled
          ...(loaded &&
          imageBackground === "average" &&
          averageColor &&
          !fillCanvasBackground
            ? { backgroundColor: averageColor }
            : {}),
          // In zoomed modes, set explicit dimensions
          ...(isPannable && zoomLevel !== "fit" && naturalSize.width > 0
            ? {
                width: `${naturalSize.width * (zoomLevel === "2x" ? 2 : 1)}px`,
                height: `${naturalSize.height * (zoomLevel === "2x" ? 2 : 1)}px`,
                minWidth: `${naturalSize.width * (zoomLevel === "2x" ? 2 : 1)}px`,
                minHeight: `${naturalSize.height * (zoomLevel === "2x" ? 2 : 1)}px`,
                flexShrink: 0,
              }
            : {}),
        }}
        className={cn(
          getBackgroundClass(),
          getCursor(),
          isPannable
            ? !isExpanded
              ? "max-h-full max-w-full object-contain select-none" // Pan fit mode
              : "max-h-none! max-w-none! select-none" // Pan 1:1 mode: no constraints
            : "max-h-full max-w-full object-contain", // Normal: fit container
        )}
        onLoad={handleLoad}
        onError={onError}
        onClick={handleClick}
      />

      {/* Bottom sentinel for tracking when bottom of container is visible */}
      <div
        ref={bottomSentinelRef}
        className="absolute right-0 bottom-0 h-px w-px"
      />

      {/* Control buttons - fixed when scrolling, absolute when bottom visible */}
      {loaded && isInView && (
        <div
          className={cn(
            "right-4 bottom-4 z-50 flex gap-1 opacity-50 transition-opacity hover:opacity-100",
            isPannable
              ? "fixed"
              : isBottomVisible
                ? "absolute sm:right-6"
                : cn(
                    "fixed sm:right-12",
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
                pressed={zoomLevel === "fit"}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom("fit");
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
                pressed={zoomLevel === "1x"}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom("1x");
                }}
                title="View 1:1"
              >
                <span className="text-xs font-medium">1×</span>
              </Toggle>

              {/* 3. 2x zoom */}
              <Toggle
                variant="outline"
                size="sm"
                className="bg-card"
                pressed={zoomLevel === "2x"}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom("2x");
                }}
                title="View 2×"
              >
                <span className="text-xs font-medium">2×</span>
              </Toggle>

              {/* 4. Theater toggle (on/off or switch from fullscreen) */}
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

              {/* 3. Fullscreen toggle (on/off or switch from theater) */}
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
                  toggleZoom();
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
