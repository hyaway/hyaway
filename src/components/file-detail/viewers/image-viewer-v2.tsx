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
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { cn } from "@/lib/utils";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import {
  useFileViewerStartExpanded,
  useFillCanvasBackground,
  useImageBackground,
} from "@/stores/file-viewer-settings-store";
import { Toggle } from "@/components/ui-primitives/toggle";

interface ImageViewerV2Props {
  fileUrl: string;
  fileId: number;
  blurhash?: string;
  onLoad: () => void;
  onError: () => void;
}

// Controls for pan mode - must be inside TransformWrapper
function PanModeControls({
  onExitOverlay,
  onToggleFullscreen,
  isFullscreen,
}: {
  onExitOverlay: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

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
        pressed={false}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFullscreen();
        }}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <IconMinimize className="size-4" />
        ) : (
          <IconMaximize className="size-4" />
        )}
      </Toggle>

      <Toggle
        variant="outline"
        size="sm"
        pressed={false}
        onClick={(e) => {
          e.stopPropagation();
          onExitOverlay();
        }}
        title="Exit"
      >
        <span className="text-xs font-medium">Exit</span>
      </Toggle>
    </div>
  );
}

export function ImageViewerV2({
  fileUrl,
  fileId,
  blurhash,
  onLoad,
  onError,
}: ImageViewerV2Props) {
  const startExpanded = useFileViewerStartExpanded();
  const imageBackground = useImageBackground();
  const fillCanvasBackground = useFillCanvasBackground();

  // Overlay mode: theater or fullscreen (null = normal view)
  const [overlayMode, setOverlayMode] = useState<
    "theater" | "fullscreen" | null
  >(null);

  // Normal mode: fit or expanded (1x)
  const [isExpanded, setIsExpanded] = useState(startExpanded);

  const [loaded, setLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  const isFullscreen = overlayMode === "fullscreen";
  const isTheater = overlayMode === "theater";
  const isPannable = isFullscreen || isTheater;

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

  // Enter theater mode
  const enterTheater = useCallback(() => {
    setOverlayMode("theater");
  }, []);

  // Enter fullscreen mode
  const enterFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen();
    setOverlayMode("fullscreen");
  }, []);

  // Exit overlay (theater or fullscreen)
  const exitOverlay = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setOverlayMode(null);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      setOverlayMode("theater");
    } else {
      containerRef.current?.requestFullscreen();
      setOverlayMode("fullscreen");
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes (e.g., user presses Esc)
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!isPannable) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitOverlay();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPannable, exitOverlay]);

  // Toggle normal mode zoom
  const toggleNormalZoom = () => {
    setIsExpanded((prev) => {
      if (prev) {
        // Going from expanded to fit - scroll to top
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      return !prev;
    });
  };

  // Get background style
  const getBackgroundStyle = () => {
    if (fillCanvasBackground && loaded && averageColor) {
      return { backgroundColor: averageColor };
    }
    return {};
  };

  const getBackgroundClass = () => {
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
  };

  // Container classes for overlay modes
  const getContainerClass = () => {
    if (overlayMode === "theater") {
      return "fixed inset-0 z-50 bg-black/95";
    }
    if (overlayMode === "fullscreen") {
      return "bg-black";
    }
    // Normal mode: use height classes
    return isExpanded ? viewerMinHeight : viewerFixedHeight;
  };

  // Normal mode: simple image display
  if (!isPannable) {
    return (
      <div
        ref={containerRef}
        style={getBackgroundStyle()}
        className={cn(
          "group relative flex items-center justify-center overflow-hidden",
          getContainerClass(),
          getBackgroundClass(),
          isExpanded ? "cursor-zoom-out" : "cursor-zoom-in",
        )}
        onClick={toggleNormalZoom}
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
            isExpanded
              ? "max-w-full" // Expanded: only constrain width, allow natural height
              : "max-h-full max-w-full object-contain", // Fit: constrain both dimensions
          )}
          onLoad={handleLoad}
          onError={onError}
          draggable={false}
        />

        {/* Controls */}
        <div className="bg-card/90 absolute right-4 bottom-4 z-10 flex gap-1 rounded-md border p-1 opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Toggle
            variant="outline"
            size="sm"
            pressed={false}
            onClick={(e) => {
              e.stopPropagation();
              enterTheater();
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
              enterFullscreen();
            }}
            title="Fullscreen"
          >
            <IconMaximize className="size-4" />
          </Toggle>
        </div>
      </div>
    );
  }

  // Pan mode: TransformWrapper for zoom/pan
  return (
    <div
      ref={containerRef}
      style={getBackgroundStyle()}
      className={cn(
        "group relative flex h-full w-full items-center justify-center overflow-hidden",
        getContainerClass(),
        getBackgroundClass(),
      )}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.1}
        maxScale={10}
        centerOnInit={true}
        limitToBounds={false}
        panning={{ velocityDisabled: false }}
        doubleClick={{ disabled: false, mode: "reset" }}
      >
        <PanModeControls
          onExitOverlay={exitOverlay}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />

        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            ref={imageRef}
            key={fileId}
            src={fileUrl}
            alt=""
            className="max-h-none max-w-none"
            style={{
              width: naturalSize.width || "auto",
              height: naturalSize.height || "auto",
            }}
            onLoad={handleLoad}
            onError={onError}
            draggable={false}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
