import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconArrowsMaximize, IconMaximize } from "@tabler/icons-react";
import {
  TransformComponent,
  TransformWrapper,
  useControls,
  useTransformEffect,
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
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });

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
    const image = imageRef.current;
    if (image) {
      setImageNaturalSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    }
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

  useEffect(() => {
    if (!isPannable) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    window.scrollTo({ top: 0, behavior: "instant" });

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isPannable]);

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

  useEffect(() => {
    if (!container) return;

    const updateSize = () => {
      setSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [container]);

  return size;
}

// ============================================================================
// Subcomponents
// ============================================================================

// Tolerance for matching scale values (±3%)
const SCALE_TOLERANCE = 0.03;

function isNearScale(current: number, target: number): boolean {
  return Math.abs(current - target) <= target * SCALE_TOLERANCE;
}

/** Controls toolbar for pan mode - must be inside TransformWrapper */
function PanModeControls({
  fitScale,
  isFullscreen,
  onExitOverlay,
  onEnterTheater,
  onEnterFullscreen,
}: {
  fitScale: number;
  isFullscreen: boolean;
  onExitOverlay: () => void;
  onEnterTheater: () => void;
  onEnterFullscreen: () => void;
}) {
  const { resetTransform, centerView } = useControls();
  const [currentScale, setCurrentScale] = useState(fitScale);
  const isTheater = !isFullscreen;

  // Track scale changes without causing parent re-renders
  useTransformEffect(({ state }) => {
    setCurrentScale(state.scale);
  });

  // Determine which zoom level we're at
  const isAtFit = isNearScale(currentScale, fitScale);
  const isAt1x = isNearScale(currentScale, 1);

  return (
    <div className="bg-card/90 pointer-hover:opacity-0 pointer-hover:group-hover:opacity-100 absolute right-4 bottom-4 z-10 flex gap-1 rounded-md border p-1 opacity-100 shadow-lg backdrop-blur-sm transition-opacity">
      <Toggle
        variant="outline"
        size="sm"
        pressed={isAtFit}
        onClick={(e) => {
          e.stopPropagation();
          resetTransform();
        }}
        title="Fit to screen"
      >
        <span className="text-xs font-medium">Fit</span>
      </Toggle>

      <Toggle
        variant="outline"
        size="sm"
        pressed={isAt1x}
        onClick={(e) => {
          e.stopPropagation();
          // Scale 1 = natural size, centered
          centerView(1, 300, "easeOut");
        }}
        title="Original size"
      >
        <span className="text-xs font-medium">1×</span>
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
            // Switch from fullscreen to theater: exit fullscreen first
            if (document.fullscreenElement) document.exitFullscreen();
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

/** Zoom level indicator - lower third, shows when scale changes */
function ZoomBadge() {
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState<number | null>(null);
  const lastScaleRef = useRef(Number.NaN);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useTransformEffect(({ state }) => {
    const isFirstUpdate = Number.isNaN(lastScaleRef.current);
    const hasMeaningfulChange =
      Math.abs(state.scale - lastScaleRef.current) >= 0.01;
    if (!isFirstUpdate && !hasMeaningfulChange) return;
    lastScaleRef.current = state.scale;

    setScale(state.scale);

    setIsVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 1000);
  });

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center pb-[15vh]">
      <div className="bg-card/90 text-foreground rounded-md px-3 py-2 text-sm font-medium tabular-nums shadow-lg">
        {scale !== null ? `${scale.toFixed(2)}×` : ""}
      </div>
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
    <div className="bg-card/90 pointer-hover:opacity-0 pointer-hover:group-hover:opacity-100 absolute right-4 bottom-4 z-10 flex gap-1 rounded-md border p-1 opacity-100 shadow-lg backdrop-blur-sm transition-opacity">
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
  // In theater/fullscreen, scale to fit the screen (even scaling up small images)
  // minScale allows zooming out to 1x for small images that were scaled up
  const minScale = Math.min(1, fitScale);

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
          // Start at fit scale (fills the screen)
          initialScale={fitScale}
          // Allow zooming out to 1x for upscaled images, or to fit for large images
          minScale={minScale}
          maxScale={Math.max(1, fitScale) * 4}
          centerOnInit={true}
          doubleClick={{ disabled: false, mode: "reset" }}
        >
          <ZoomBadge />

          <PanModeControls
            fitScale={fitScale}
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
              className="max-h-none max-w-none"
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
