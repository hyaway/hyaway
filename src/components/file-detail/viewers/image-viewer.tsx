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
  // Expanded state is independent of overlay modes
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const [loaded, setLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const imageBackground = useImageBackground();

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

  // Toggle zoom (collapsed/fit <-> expanded/1:1) - works across all modes
  const toggleZoom = useCallback(() => {
    setIsExpanded((prev) => {
      if (prev && !isPannable) {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      return !prev;
    });
    dragX.set(0);
    dragY.set(0);
  }, [isPannable, dragX, dragY]);

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

  // Determine background style based on setting
  const getBackgroundClass = () => {
    if (!loaded) return "bg-background";
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

    if (isPannable) {
      // Single click: toggle zoom (fit ↔ 1:1)
      if (e.detail === 1) {
        toggleZoom();
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
    if (overlayMode === "theater") return "fixed inset-0 z-50 bg-black/95";
    if (overlayMode === "fullscreen") return "h-screen w-screen bg-black";
    return isExpanded ? viewerMinHeight : viewerFixedHeight;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative flex items-center justify-center overflow-hidden",
        getContainerClass(),
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
        dragElastic={0.1}
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
          ...(loaded && imageBackground === "average" && averageColor
            ? { backgroundColor: averageColor }
            : {}),
          // In 1:1 mode, set explicit dimensions to prevent any constraints
          ...(isPannable && isExpanded && naturalSize.width > 0
            ? {
                width: `${naturalSize.width}px`,
                height: `${naturalSize.height}px`,
                minWidth: `${naturalSize.width}px`,
                minHeight: `${naturalSize.height}px`,
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
              {/* 1. Zoom toggle (fit ↔ 1:1) */}
              <Toggle
                variant="outline"
                size="sm"
                pressed={isExpanded}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleZoom();
                }}
                title={isExpanded ? "Fit to screen" : "View 1:1"}
              >
                {isExpanded ? (
                  <IconZoomOut className="size-4" />
                ) : (
                  <IconZoomIn className="size-4" />
                )}
              </Toggle>

              {/* 2. Theater toggle (on/off or switch from fullscreen) */}
              <Toggle
                variant="outline"
                size="sm"
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
