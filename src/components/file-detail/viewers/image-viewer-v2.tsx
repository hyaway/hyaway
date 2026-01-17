import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowsMaximize,
  IconMaximize,
  IconMinimize,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from "react-zoom-pan-pinch";
import { viewerFixedHeight, viewerMinHeight } from "./style-constants";
import { cn } from "@/lib/utils";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import {
  useFileViewerStartExpanded,
  useFillCanvasBackground,
  useImageBackground,
} from "@/stores/file-viewer-settings-store";
import { Toggle } from "@/components/ui-primitives/toggle";

// ============================================================================
// Types
// ============================================================================

interface ImageViewerV2Props {
  fileUrl: string;
  fileId: number;
  blurhash?: string;
  onLoad: () => void;
  onError: () => void;
}

type OverlayMode = "theater" | "fullscreen" | null;

// ============================================================================
// Main Component
// ============================================================================

export function ImageViewerV2({
  fileUrl,
  fileId,
  blurhash,
  onLoad,
  onError,
}: ImageViewerV2Props) {
  const startExpanded = useFileViewerStartExpanded();

  // State
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(null);
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const [loaded, setLoaded] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Derived state
  const isFullscreen = overlayMode === "fullscreen";
  const isTheater = overlayMode === "theater";
  const isPannable = isFullscreen || isTheater;

  // Computed values
  const averageColor = useMemo(
    () => getAverageColorFromBlurhash(blurhash),
    [blurhash],
  );

  const containerSize = useContainerSize(container);
  const imageNaturalSize = useImageNaturalSize(fileUrl, isPannable);
  const { style: backgroundStyle, className: backgroundClass } =
    useBackgroundStyles(loaded, averageColor);

  // Calculate fit scale for pan mode
  const fitScale = useMemo(() => {
    if (
      containerSize.width === 0 ||
      containerSize.height === 0 ||
      imageNaturalSize.width === 0 ||
      imageNaturalSize.height === 0
    ) {
      return 0;
    }
    return Math.min(
      containerSize.width / imageNaturalSize.width,
      containerSize.height / imageNaturalSize.height,
    );
  }, [containerSize, imageNaturalSize]);

  // Container class based on mode
  const containerClass = useMemo(() => {
    if (overlayMode === "theater") return "fixed inset-0 z-50 bg-black/95";
    if (overlayMode === "fullscreen") return "bg-black";
    return isExpanded ? viewerMinHeight : viewerFixedHeight;
  }, [overlayMode, isExpanded]);

  // Handlers
  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad();
  }, [onLoad]);

  const enterTheater = useCallback(() => setOverlayMode("theater"), []);

  // From normal mode, we first enter theater (which renders PanModeViewer),
  // then request fullscreen on the next frame when that container is mounted
  const enterFullscreen = useCallback(() => {
    setOverlayMode("fullscreen");
  }, []);

  // Effect to handle fullscreen request when entering fullscreen mode
  useEffect(() => {
    if (overlayMode === "fullscreen" && !document.fullscreenElement) {
      // Request fullscreen on next frame to ensure PanModeViewer is mounted
      requestAnimationFrame(() => {
        containerRef.current?.requestFullscreen();
      });
    }
  }, [overlayMode]);

  const exitOverlay = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    setOverlayMode(null);
  }, []);

  const toggleNormalZoom = useCallback(() => {
    setIsExpanded((prev) => {
      if (prev) window.scrollTo({ top: 0, behavior: "auto" });
      return !prev;
    });
  }, []);

  // Effects
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setOverlayMode(null);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isPannable) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitOverlay();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPannable, exitOverlay]);

  // Render
  if (!isPannable) {
    return (
      <NormalModeViewer
        fileUrl={fileUrl}
        fileId={fileId}
        blurhash={blurhash}
        averageColor={averageColor}
        loaded={loaded}
        isExpanded={isExpanded}
        containerRef={containerRef}
        imageRef={imageRef}
        backgroundStyle={backgroundStyle}
        backgroundClass={backgroundClass}
        containerClass={containerClass}
        onToggleZoom={toggleNormalZoom}
        onLoad={handleLoad}
        onError={onError}
        onEnterTheater={enterTheater}
        onEnterFullscreen={enterFullscreen}
      />
    );
  }

  // Combined ref callback for pan mode
  const handleContainerRef = useCallback(
    (el: HTMLDivElement | null) => {
      setContainer(el);
      containerRef.current = el;
    },
    [setContainer],
  );

  return (
    <PanModeViewer
      fileUrl={fileUrl}
      fileId={fileId}
      fitScale={fitScale}
      containerSize={containerSize}
      onContainerRef={handleContainerRef}
      imageRef={imageRef}
      backgroundStyle={backgroundStyle}
      backgroundClass={backgroundClass}
      containerClass={containerClass}
      isFullscreen={isFullscreen}
      onLoad={handleLoad}
      onError={onError}
      onExitOverlay={exitOverlay}
      onEnterTheater={enterTheater}
      onEnterFullscreen={enterFullscreen}
    />
  );
}

// ============================================================================
// Hooks
// ============================================================================

/** Hook to get background style and class based on settings */
function useBackgroundStyles(
  loaded: boolean,
  averageColor: string | undefined,
) {
  const imageBackground = useImageBackground();
  const fillCanvasBackground = useFillCanvasBackground();

  const style = useMemo(() => {
    if (fillCanvasBackground && loaded && averageColor) {
      return { backgroundColor: averageColor };
    }
    return {};
  }, [fillCanvasBackground, loaded, averageColor]);

  const className = useMemo(() => {
    if (fillCanvasBackground && loaded) return "";

    switch (imageBackground) {
      case "checkerboard":
        return "bg-checkered";
      case "solid":
        return "bg-background";
      case "average":
        return "";
      default:
        return "bg-background";
    }
  }, [imageBackground, fillCanvasBackground, loaded]);

  return { style, className };
}

/** Hook to track container size for responsive fit scale */
function useContainerSize(container: HTMLElement | null) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleResize = useCallback(() => {
    if (container) {
      const rect = container.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    }
  }, [container]);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  return size;
}

/** Hook to load image natural size */
function useImageNaturalSize(src: string, enabled: boolean) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!enabled) return;

    const image = new Image();
    image.onload = () => {
      setSize({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.src = src;
  }, [src, enabled]);

  return size;
}

// ============================================================================
// Subcomponents
// ============================================================================

/** Controls toolbar for pan mode - must be inside TransformWrapper */
function PanModeControls({
  isFullscreen,
  onExitOverlay,
  onEnterTheater,
  onEnterFullscreen,
}: {
  isFullscreen: boolean;
  onExitOverlay: () => void;
  onEnterTheater: () => void;
  onEnterFullscreen: () => void;
}) {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const isTheater = !isFullscreen;

  return (
    <div className="bg-card/90 absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-md border p-1 opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100">
      <Toggle
        variant="outline"
        size="sm"
        pressed={false}
        onClick={(e) => {
          e.stopPropagation();
          zoomOut();
        }}
        title="Zoom out"
      >
        <IconZoomOut className="size-4" />
      </Toggle>

      <Toggle
        variant="outline"
        size="sm"
        pressed={false}
        onClick={(e) => {
          e.stopPropagation();
          resetTransform();
        }}
        title="Reset zoom"
      >
        <span className="text-xs font-medium">Reset</span>
      </Toggle>

      <Toggle
        variant="outline"
        size="sm"
        pressed={false}
        onClick={(e) => {
          e.stopPropagation();
          zoomIn();
        }}
        title="Zoom in"
      >
        <IconZoomIn className="size-4" />
      </Toggle>

      <div className="bg-border mx-1 w-px" />

      <Toggle
        variant="outline"
        size="sm"
        pressed={isTheater}
        onClick={(e) => {
          e.stopPropagation();
          if (isTheater) {
            onExitOverlay();
          } else {
            onEnterTheater();
          }
        }}
        title="Theater mode"
      >
        <IconArrowsMaximize className="size-4" />
      </Toggle>

      <Toggle
        variant="outline"
        size="sm"
        pressed={isFullscreen}
        onClick={(e) => {
          e.stopPropagation();
          if (isFullscreen) {
            onExitOverlay();
          } else {
            onEnterFullscreen();
          }
        }}
        title="Fullscreen"
      >
        <IconMaximize className="size-4" />
      </Toggle>
    </div>
  );
}

/** Controls toolbar for normal mode */
function NormalModeControls({
  onEnterTheater,
  onEnterFullscreen,
}: {
  onEnterTheater: () => void;
  onEnterFullscreen: () => void;
}) {
  return (
    <div className="bg-card/90 absolute right-4 bottom-4 z-10 flex gap-1 rounded-md border p-1 opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100">
      <Toggle
        variant="outline"
        size="sm"
        pressed={false}
        onClick={(e) => {
          e.stopPropagation();
          onEnterTheater();
        }}
        title="Theater mode"
      >
        <IconArrowsMaximize className="size-4" />
      </Toggle>

      <Toggle
        variant="outline"
        size="sm"
        pressed={false}
        onClick={(e) => {
          e.stopPropagation();
          onEnterFullscreen();
        }}
        title="Fullscreen"
      >
        <IconMaximize className="size-4" />
      </Toggle>
    </div>
  );
}

/** Normal mode viewer - simple image with fit/expand toggle */
function NormalModeViewer({
  fileUrl,
  fileId,
  blurhash,
  averageColor,
  loaded,
  isExpanded,
  containerRef,
  imageRef,
  backgroundStyle,
  backgroundClass,
  containerClass,
  onToggleZoom,
  onLoad,
  onError,
  onEnterTheater,
  onEnterFullscreen,
}: {
  fileUrl: string;
  fileId: number;
  blurhash?: string;
  averageColor: string | undefined;
  loaded: boolean;
  isExpanded: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  backgroundStyle: React.CSSProperties;
  backgroundClass: string;
  containerClass: string;
  onToggleZoom: () => void;
  onLoad: () => void;
  onError: () => void;
  onEnterTheater: () => void;
  onEnterFullscreen: () => void;
}) {
  return (
    <div
      ref={containerRef}
      style={backgroundStyle}
      className={cn(
        "group relative flex items-center justify-center overflow-hidden",
        containerClass,
        backgroundClass,
        isExpanded ? "cursor-zoom-out" : "cursor-zoom-in",
      )}
      onClick={onToggleZoom}
    >
      {/* Blurhash placeholder */}
      {!loaded && blurhash && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="bg-muted size-full animate-pulse"
            style={{ backgroundColor: averageColor || undefined }}
          />
        </div>
      )}

      {/* Image */}
      <img
        ref={imageRef}
        key={fileId}
        src={fileUrl}
        alt=""
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          isExpanded ? "max-w-full" : "max-h-full max-w-full object-contain",
        )}
        onLoad={onLoad}
        onError={onError}
        draggable={false}
      />

      <NormalModeControls
        onEnterTheater={onEnterTheater}
        onEnterFullscreen={onEnterFullscreen}
      />
    </div>
  );
}

/** Pan mode viewer - zoom/pan with TransformWrapper */
function PanModeViewer({
  fileUrl,
  fileId,
  fitScale,
  containerSize,
  onContainerRef,
  imageRef,
  backgroundStyle,
  backgroundClass,
  containerClass,
  isFullscreen,
  onLoad,
  onError,
  onExitOverlay,
  onEnterTheater,
  onEnterFullscreen,
}: {
  fileUrl: string;
  fileId: number;
  fitScale: number;
  containerSize: { width: number; height: number };
  onContainerRef: (el: HTMLDivElement | null) => void;
  imageRef: React.RefObject<HTMLImageElement | null>;
  backgroundStyle: React.CSSProperties;
  backgroundClass: string;
  containerClass: string;
  isFullscreen: boolean;
  onLoad: () => void;
  onError: () => void;
  onExitOverlay: () => void;
  onEnterTheater: () => void;
  onEnterFullscreen: () => void;
}) {
  return (
    <div
      ref={onContainerRef}
      style={backgroundStyle}
      className={cn(
        "group relative h-full w-full overflow-hidden",
        containerClass,
        backgroundClass,
      )}
    >
      {fitScale > 0 && (
        <TransformWrapper
          key={`${containerSize.width}x${containerSize.height}`}
          // Fit if larger, original size if smaller (never scale up beyond 100%)
          initialScale={Math.min(1, fitScale)}
          minScale={Math.min(1, fitScale)}
          maxScale={Math.max(1, fitScale) * 4}
          centerOnInit
          doubleClick={{ disabled: false, mode: "reset" }}
        >
          <PanModeControls
            isFullscreen={isFullscreen}
            onExitOverlay={onExitOverlay}
            onEnterTheater={onEnterTheater}
            onEnterFullscreen={onEnterFullscreen}
          />

          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
            <img
              ref={imageRef}
              key={fileId}
              src={fileUrl}
              alt=""
              onLoad={onLoad}
              onError={onError}
              draggable={false}
            />
          </TransformComponent>
        </TransformWrapper>
      )}
    </div>
  );
}
