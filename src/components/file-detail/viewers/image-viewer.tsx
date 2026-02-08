// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowsMaximize,
  IconMaximize,
  IconPalette,
  IconX,
} from "@tabler/icons-react";
import {
  TransformComponent,
  TransformWrapper,
  useControls,
  useTransformEffect,
} from "react-zoom-pan-pinch";
import { viewerFixedHeight, viewerMinHeight } from "./style-constants";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { ImageBackground } from "@/stores/file-viewer-settings-store";
import { cn } from "@/lib/utils";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import { shouldIgnoreKeyboardEvent } from "@/lib/keyboard-utils";
import { useImageBackgroundCycle } from "@/hooks/use-image-background-cycle";
import {
  useFileViewerStartExpanded,
  useFillCanvasBackground,
} from "@/stores/file-viewer-settings-store";
import { Toggle } from "@/components/ui-primitives/toggle";

const SCALE_TOLERANCE = 0.03;
const MAX_ZOOM = 4;

interface ImageViewerProps {
  fileUrl: string;
  fileId: number;
  blurhash?: string;
  onLoad: () => void;
  onError: () => void;
}

type ViewerMode = "inline" | "theater" | "fullscreen";

type ZoomIntent = "fit" | "1x" | "free";

export function ImageViewer({
  fileUrl,
  fileId,
  blurhash,
  onLoad,
  onError,
}: ImageViewerProps) {
  const startExpanded = useFileViewerStartExpanded();
  const [viewerMode, setViewerMode] = useState<ViewerMode>("inline");
  const [inlineExpanded, setInlineExpanded] = useState(startExpanded);
  const [loaded, setLoaded] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });
  const [isAtFit, setIsAtFit] = useState(true);
  const [isAt1x, setIsAt1x] = useState(false);
  const [modeChangeToken, setModeChangeToken] = useState(0);
  const overlayRootRef = useRef<HTMLDivElement>(null);
  const overlayStageRef = useRef<HTMLDivElement>(null);
  const currentScaleRef = useRef(1);
  const currentPositionRef = useRef({ x: 0, y: 0 });
  const zoomIntentRef = useRef<ZoomIntent>("fit");
  const hasNotifiedLoadRef = useRef(false);
  const isZoomingRef = useRef(false);
  const isPanningRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);

  const isOverlayActive = viewerMode !== "inline";
  const isTheater = viewerMode === "theater";
  const isFullscreen = viewerMode === "fullscreen";

  const averageColor = useMemo(
    () => getAverageColorFromBlurhash(blurhash),
    [blurhash],
  );

  const { imageBackground: effectiveImageBackground, cycleImageBackground } =
    useImageBackgroundCycle();
  const fillCanvasBackground = useFillCanvasBackground();

  const overlaySize = useContainerSize(overlayStageRef.current);

  const rawFitScale = useMemo(() => {
    if (
      overlaySize.width === 0 ||
      overlaySize.height === 0 ||
      imageNaturalSize.width === 0 ||
      imageNaturalSize.height === 0
    ) {
      return 0;
    }

    return Math.min(
      overlaySize.width / imageNaturalSize.width,
      overlaySize.height / imageNaturalSize.height,
    );
  }, [overlaySize, imageNaturalSize]);

  const fitScale = useMemo(() => Math.min(1, rawFitScale), [rawFitScale]);
  const minScale = fitScale > 0 ? fitScale : 1;

  const { containerStyle, containerClassName, imageStyle, imageClassName } =
    useBackgroundStyles(
      loaded,
      averageColor,
      effectiveImageBackground,
      fillCanvasBackground,
    );

  const overlayReady =
    isOverlayActive &&
    loaded &&
    fitScale > 0 &&
    overlaySize.width > 0 &&
    overlaySize.height > 0;

  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      setLoaded(true);
      setImageNaturalSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });

      if (!hasNotifiedLoadRef.current) {
        hasNotifiedLoadRef.current = true;
        onLoad();
      }
    },
    [onLoad],
  );

  const toggleInlineExpanded = useCallback(() => {
    setInlineExpanded((prev) => {
      if (prev) window.scrollTo({ top: 0, behavior: "auto" });
      return !prev;
    });
  }, []);

  const setCurrentScale = useCallback((scale: number) => {
    currentScaleRef.current = scale;
  }, []);

  const setCurrentPosition = useCallback((x: number, y: number) => {
    currentPositionRef.current = { x, y };
  }, []);

  const getCurrentScale = useCallback(() => currentScaleRef.current, []);

  const setZoomIntent = useCallback((intent: ZoomIntent) => {
    zoomIntentRef.current = intent;
  }, []);

  const clampToBounds = useCallback(
    (x: number, y: number, scale: number) => {
      if (
        overlaySize.width === 0 ||
        overlaySize.height === 0 ||
        imageNaturalSize.width === 0 ||
        imageNaturalSize.height === 0
      ) {
        return { x, y };
      }

      const scaledWidth = imageNaturalSize.width * scale;
      const scaledHeight = imageNaturalSize.height * scale;
      const centerX = (overlaySize.width - scaledWidth) / 2;
      const centerY = (overlaySize.height - scaledHeight) / 2;

      let clampedX = x;
      let clampedY = y;

      if (scaledWidth <= overlaySize.width) {
        clampedX = centerX;
      } else {
        const minX = overlaySize.width - scaledWidth;
        clampedX = Math.min(0, Math.max(minX, clampedX));
      }

      if (scaledHeight <= overlaySize.height) {
        clampedY = centerY;
      } else {
        const minY = overlaySize.height - scaledHeight;
        clampedY = Math.min(0, Math.max(minY, clampedY));
      }

      return { x: clampedX, y: clampedY };
    },
    [imageNaturalSize, overlaySize],
  );

  const getVerticalBoundY = useCallback(
    (scale: number, edge: "top" | "bottom") => {
      if (
        overlaySize.height === 0 ||
        imageNaturalSize.height === 0 ||
        scale === 0
      ) {
        return 0;
      }

      const scaledHeight = imageNaturalSize.height * scale;
      if (scaledHeight <= overlaySize.height) {
        return (overlaySize.height - scaledHeight) / 2;
      }

      const minY = overlaySize.height - scaledHeight;
      return edge === "top" ? 0 : minY;
    },
    [imageNaturalSize.height, overlaySize.height],
  );

  const bumpModeToken = useCallback(() => {
    setModeChangeToken((prev) => prev + 1);
  }, []);

  const returnInline = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setViewerMode("inline");
    bumpModeToken();
  }, [bumpModeToken]);

  const enterTheater = useCallback(() => {
    setViewerMode("theater");
    zoomIntentRef.current = "fit";
    bumpModeToken();
  }, [bumpModeToken]);

  const enterFullscreen = useCallback(() => {
    const overlayRoot = overlayRootRef.current;
    if (!overlayRoot) return;

    overlayRoot
      .requestFullscreen()
      .then(() => {
        setViewerMode("fullscreen");
        zoomIntentRef.current = "fit";
        bumpModeToken();
      })
      .catch(() => {
        // No-op when fullscreen is denied or unavailable
      });
  }, [bumpModeToken]);

  const toggleTheater = useCallback(() => {
    if (isTheater) {
      returnInline();
      return;
    }
    if (isFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      setViewerMode("theater");
      zoomIntentRef.current = "fit";
      bumpModeToken();
      return;
    }
    enterTheater();
  }, [bumpModeToken, enterTheater, isFullscreen, isTheater, returnInline]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      returnInline();
      return;
    }

    if (isTheater) {
      enterFullscreen();
      return;
    }

    enterFullscreen();
  }, [enterFullscreen, isFullscreen, isTheater, returnInline]);

  useEffect(() => {
    if (!isOverlayActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        returnInline();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOverlayActive, returnInline]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyboardEvent(event)) return;

      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        toggleTheater();
        return;
      }

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleFullscreen();
        return;
      }

      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        cycleImageBackground();
        return;
      }

      if (!isOverlayActive && (event.key === "z" || event.key === "Z")) {
        event.preventDefault();
        toggleInlineExpanded();
        return;
      }

      if (!isOverlayActive) return;

      const controls = transformRef.current;
      if (!controls) return;

      const panStep = 40;
      const { x, y } = currentPositionRef.current;
      const currentScale = currentScaleRef.current;

      switch (event.key) {
        case "+":
        case "=":
          event.preventDefault();
          controls.zoomIn(0.2, 150, "easeOut");
          return;
        case "-":
          event.preventDefault();
          controls.zoomOut(0.2, 150, "easeOut");
          return;
        case "0":
          event.preventDefault();
          controls.centerView(fitScale, 0, "linear");
          return;
        case "z":
        case "Z": {
          event.preventDefault();
          const nearOneX = isNearScale(currentScale, 1);
          const targetScale = nearOneX
            ? fitScale
            : Math.min(MAX_ZOOM, Math.max(fitScale, 1));
          controls.centerView(targetScale, 0, "linear");
          return;
        }
        case "ArrowUp":
        case "Numpad8":
          if (currentScale <= fitScale + SCALE_TOLERANCE) return;
          event.preventDefault();
          {
            const clamped = clampToBounds(x, y + panStep, currentScale);
            controls.setTransform(
              clamped.x,
              clamped.y,
              currentScale,
              0,
              "linear",
            );
          }
          return;
        case "ArrowDown":
        case "Numpad2":
          if (currentScale <= fitScale + SCALE_TOLERANCE) return;
          event.preventDefault();
          {
            const clamped = clampToBounds(x, y - panStep, currentScale);
            controls.setTransform(
              clamped.x,
              clamped.y,
              currentScale,
              0,
              "linear",
            );
          }
          return;
        case "ArrowLeft":
        case "Numpad4":
          if (currentScale <= fitScale + SCALE_TOLERANCE) return;
          event.preventDefault();
          {
            const clamped = clampToBounds(x + panStep, y, currentScale);
            controls.setTransform(
              clamped.x,
              clamped.y,
              currentScale,
              0,
              "linear",
            );
          }
          return;
        case "ArrowRight":
        case "Numpad6":
          if (currentScale <= fitScale + SCALE_TOLERANCE) return;
          event.preventDefault();
          {
            const clamped = clampToBounds(x - panStep, y, currentScale);
            controls.setTransform(
              clamped.x,
              clamped.y,
              currentScale,
              0,
              "linear",
            );
          }
          return;
        case "PageUp":
          if (currentScale <= fitScale + SCALE_TOLERANCE) return;
          event.preventDefault();
          {
            const clamped = clampToBounds(x, y + panStep * 6, currentScale);
            controls.setTransform(
              clamped.x,
              clamped.y,
              currentScale,
              0,
              "linear",
            );
          }
          return;
        case "PageDown":
          if (currentScale <= fitScale + SCALE_TOLERANCE) return;
          event.preventDefault();
          {
            const clamped = clampToBounds(x, y - panStep * 6, currentScale);
            controls.setTransform(
              clamped.x,
              clamped.y,
              currentScale,
              0,
              "linear",
            );
          }
          return;
        case "Home":
          if (currentScale <= fitScale + SCALE_TOLERANCE) return;
          event.preventDefault();
          {
            const targetY = getVerticalBoundY(currentScale, "top");
            const clamped = clampToBounds(x, targetY, currentScale);
            controls.setTransform(
              clamped.x,
              clamped.y,
              currentScale,
              0,
              "linear",
            );
          }
          return;
        case "End":
          if (currentScale <= fitScale + SCALE_TOLERANCE) return;
          event.preventDefault();
          {
            const targetY = getVerticalBoundY(currentScale, "bottom");
            const clamped = clampToBounds(x, targetY, currentScale);
            controls.setTransform(
              clamped.x,
              clamped.y,
              currentScale,
              0,
              "linear",
            );
          }
          return;
        default:
          return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    clampToBounds,
    cycleImageBackground,
    fitScale,
    getVerticalBoundY,
    isOverlayActive,
    toggleFullscreen,
    toggleTheater,
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        returnInline();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isFullscreen, returnInline]);

  useEffect(() => {
    if (!isOverlayActive) return;
    overlayStageRef.current?.focus();
  }, [isOverlayActive]);

  const overlayRootClass = cn(
    "fixed inset-0 z-50",
    isOverlayActive ? "opacity-100" : "pointer-events-none opacity-0",
    isTheater ? "bg-black/95" : "bg-black",
  );

  return (
    <>
      <InlineViewer
        fileUrl={fileUrl}
        fileId={fileId}
        blurhash={blurhash}
        averageColor={averageColor}
        loaded={loaded}
        isExpanded={inlineExpanded}
        imageStyle={imageStyle}
        imageClassName={imageClassName}
        backgroundStyle={containerStyle}
        backgroundClass={containerClassName}
        onToggleZoom={toggleInlineExpanded}
        onLoad={handleImageLoad}
        onError={onError}
        onToggleTheater={toggleTheater}
        onToggleFullscreen={toggleFullscreen}
        onCycleBackground={cycleImageBackground}
      />

      <div
        ref={overlayRootRef}
        className={overlayRootClass}
        aria-hidden={!isOverlayActive}
        data-viewer-overlay={isOverlayActive || undefined}
      >
        <div
          ref={overlayStageRef}
          style={containerStyle}
          className={cn(
            "group relative h-full w-full overflow-hidden",
            // Prevent browser-native pinch zoom/scroll on touch; the transform
            // library handles gestures inside the overlay.
            "touch-none",
            isPanning ? "cursor-grabbing" : "cursor-grab",
            containerClassName,
          )}
        >
          {overlayReady && (
            <TransformWrapper
              ref={transformRef}
              minScale={minScale}
              maxScale={MAX_ZOOM}
              initialScale={fitScale}
              centerOnInit={true}
              limitToBounds={true}
              alignmentAnimation={{ sizeX: 1000, sizeY: 1000 }}
              wheel={{ step: 0.06, smoothStep: 0.0025 }}
              doubleClick={{ disabled: true }}
              onWheelStart={() => {
                isZoomingRef.current = true;
              }}
              onWheelStop={() => {
                isZoomingRef.current = false;
              }}
              onPinchingStart={() => {
                isZoomingRef.current = true;
              }}
              onPinchingStop={() => {
                isZoomingRef.current = false;
              }}
              onPanningStart={() => {
                isPanningRef.current = true;
                setIsPanning(true);
              }}
              onPanningStop={() => {
                isPanningRef.current = false;
                setIsPanning(false);
              }}
            >
              {({ centerView, resetTransform }) => (
                <>
                  <OverlayTransformState
                    fitScale={fitScale}
                    onScaleChange={setCurrentScale}
                    onPositionChange={setCurrentPosition}
                    onZoomIntentChange={setZoomIntent}
                    onFitChange={setIsAtFit}
                    onOneXChange={setIsAt1x}
                  />

                  <OverlayAxisCentering
                    containerSize={overlaySize}
                    imageNaturalSize={imageNaturalSize}
                    isZoomingRef={isZoomingRef}
                    isPanningRef={isPanningRef}
                  />

                  <OverlayFitReset
                    fitScale={fitScale}
                    modeChangeToken={modeChangeToken}
                    onScaleChange={setCurrentScale}
                    onZoomIntentChange={setZoomIntent}
                    isReady={overlayReady}
                  />

                  <OverlayResizeClamp
                    fitScale={fitScale}
                    containerSize={overlaySize}
                    getCurrentScale={getCurrentScale}
                    onZoomIntentChange={setZoomIntent}
                    isReady={overlayReady}
                  />

                  <ZoomBadge />

                  <OverlayControls
                    fitScale={fitScale}
                    isAtFit={isAtFit}
                    isAt1x={isAt1x}
                    isTheater={isTheater}
                    isFullscreen={isFullscreen}
                    onToggleTheater={toggleTheater}
                    onToggleFullscreen={toggleFullscreen}
                    onCycleBackground={cycleImageBackground}
                    onExit={returnInline}
                    onSetZoomIntent={(intent) => {
                      setZoomIntent(intent);
                    }}
                  />

                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    wrapperProps={{
                      onDoubleClick: (event) => {
                        event.stopPropagation();
                        const currentScale = getCurrentScale();
                        const isZoomedIn =
                          currentScale > fitScale * (1 + SCALE_TOLERANCE);

                        if (isZoomedIn) {
                          resetTransform();
                          return;
                        }
                        const nearFit = fitScale >= 0.5;
                        const targetScale = nearFit
                          ? Math.min(MAX_ZOOM, fitScale * 2)
                          : Math.min(MAX_ZOOM, 1);

                        centerView(targetScale, 300, "easeOut");
                      },
                    }}
                  >
                    <div className="inline-block pb-[calc(4rem+env(safe-area-inset-bottom))]">
                      <img
                        src={fileUrl}
                        alt={`File ${fileId}`}
                        style={imageStyle}
                        className={cn(
                          "block max-h-none max-w-none select-none",
                          imageClassName,
                        )}
                        onLoad={handleImageLoad}
                        onError={onError}
                      />
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          )}
        </div>
      </div>
    </>
  );
}

function InlineViewer({
  fileUrl,
  fileId,
  blurhash,
  averageColor,
  loaded,
  isExpanded,
  imageStyle,
  imageClassName,
  backgroundStyle,
  backgroundClass,
  onToggleZoom,
  onLoad,
  onError,
  onToggleTheater,
  onToggleFullscreen,
  onCycleBackground,
}: {
  fileUrl: string;
  fileId: number;
  blurhash?: string;
  averageColor: string | undefined;
  loaded: boolean;
  isExpanded: boolean;
  imageStyle: React.CSSProperties;
  imageClassName: string;
  backgroundStyle: React.CSSProperties;
  backgroundClass: string;
  onToggleZoom: () => void;
  onLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError: () => void;
  onToggleTheater: () => void;
  onToggleFullscreen: () => void;
  onCycleBackground: () => void;
}) {
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [isBottomVisible, setIsBottomVisible] = useState(true);
  const [isInView, setIsInView] = useState(true);

  const handleInlineDoubleTap = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (event.changedTouches.length !== 1) return;

      const touch = event.changedTouches[0];
      const now = Date.now();
      const previous = lastTapRef.current;
      // Guard against accidental theater entry during scroll/gesture by
      // requiring taps to be close in both time and distance.
      const maxDelayMs = 250;
      const maxDistance = 24;

      if (previous) {
        const deltaTime = now - previous.time;
        const deltaX = touch.clientX - previous.x;
        const deltaY = touch.clientY - previous.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (deltaTime <= maxDelayMs && distance <= maxDistance) {
          lastTapRef.current = null;
          onToggleTheater();
          return;
        }
      }

      lastTapRef.current = {
        time: now,
        x: touch.clientX,
        y: touch.clientY,
      };
    },
    [onToggleTheater],
  );

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

  return (
    <div
      ref={containerRef}
      style={backgroundStyle}
      className={cn(
        "group relative flex items-center justify-center overflow-hidden",
        isExpanded ? viewerMinHeight : viewerFixedHeight,
        backgroundClass,
        isExpanded ? "cursor-zoom-out" : "cursor-zoom-in",
      )}
      onClick={onToggleZoom}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onToggleTheater();
      }}
      onTouchEnd={handleInlineDoubleTap}
    >
      {!loaded && blurhash && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="bg-muted size-full animate-pulse"
            style={{ backgroundColor: averageColor || undefined }}
          />
        </div>
      )}

      <img
        src={fileUrl}
        alt={`File ${fileId}`}
        style={imageStyle}
        className={cn(
          "block transition-opacity duration-300 select-none",
          loaded ? "opacity-100" : "opacity-0",
          imageClassName,
          isExpanded ? "max-w-full" : "max-h-full max-w-full object-contain",
        )}
        onLoad={onLoad}
        onError={onError}
      />

      <div
        ref={bottomSentinelRef}
        className="absolute right-0 bottom-0 h-px w-px"
      />

      <InlineModeControls
        isExpanded={isExpanded}
        isBottomVisible={isBottomVisible}
        isInView={isInView}
        onToggleTheater={onToggleTheater}
        onToggleFullscreen={onToggleFullscreen}
        onCycleBackground={onCycleBackground}
      />
    </div>
  );
}

function InlineModeControls({
  isExpanded,
  isBottomVisible,
  isInView,
  onToggleTheater,
  onToggleFullscreen,
  onCycleBackground,
}: {
  isExpanded: boolean;
  isBottomVisible: boolean;
  isInView: boolean;
  onToggleTheater: () => void;
  onToggleFullscreen: () => void;
  onCycleBackground: () => void;
}) {
  if (!isInView) return null;

  return (
    <div
      className={cn(
        "bottom-4 z-10 flex gap-1 opacity-50 transition-opacity hover:opacity-100",
        isExpanded
          ? isBottomVisible
            ? "short:bottom-8 absolute right-0"
            : cn(
                "fixed right-6",
                "short:bottom-[calc(var(--footer-height-short)+1rem)] bottom-[calc(var(--footer-height)+1rem)] sm:bottom-[calc(var(--footer-height-sm)+1rem)]",
              )
          : "absolute right-4",
      )}
    >
      <div
        className="bg-card/90 pointer-hover:opacity-0 pointer-hover:group-hover:opacity-100 flex cursor-default gap-1 rounded-md border p-1 opacity-100 shadow-lg backdrop-blur-sm transition-opacity"
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <Toggle
          variant="outline"
          size="sm"
          pressed={false}
          className="hover:bg-accent hover:text-accent-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onCycleBackground();
          }}
          title="Cycle background (B)"
        >
          <IconPalette className="size-4" />
        </Toggle>

        <Toggle
          variant="outline"
          size="sm"
          pressed={false}
          className="hover:bg-accent hover:text-accent-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onToggleTheater();
          }}
          title="Theater mode (T)"
        >
          <IconArrowsMaximize className="size-4" />
        </Toggle>

        <Toggle
          variant="outline"
          size="sm"
          pressed={false}
          className="hover:bg-accent hover:text-accent-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFullscreen();
          }}
          title="Fullscreen (F)"
        >
          <IconMaximize className="size-4" />
        </Toggle>
      </div>
    </div>
  );
}

function OverlayControls({
  fitScale,
  isAtFit,
  isAt1x,
  isTheater,
  isFullscreen,
  onToggleTheater,
  onToggleFullscreen,
  onCycleBackground,
  onExit,
  onSetZoomIntent,
}: {
  fitScale: number;
  isAtFit: boolean;
  isAt1x: boolean;
  isTheater: boolean;
  isFullscreen: boolean;
  onToggleTheater: () => void;
  onToggleFullscreen: () => void;
  onCycleBackground: () => void;
  onExit: () => void;
  onSetZoomIntent: (intent: ZoomIntent) => void;
}) {
  const { centerView } = useControls();

  const handleFit = useCallback(() => {
    onSetZoomIntent("fit");
    centerView(fitScale, 0, "linear");
  }, [centerView, fitScale, onSetZoomIntent]);

  const handleOneX = useCallback(() => {
    onSetZoomIntent("1x");
    centerView(Math.min(MAX_ZOOM, Math.max(fitScale, 1)), 0, "linear");
  }, [centerView, fitScale, onSetZoomIntent]);

  return (
    <div className="bg-card/90 pointer-hover:opacity-0 pointer-hover:group-hover:opacity-100 absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 cursor-default gap-1 rounded-md border p-1 opacity-100 shadow-lg backdrop-blur-sm transition-opacity">
      <Toggle
        variant="outline"
        size="sm"
        pressed={isAtFit}
        className="hover:bg-accent hover:text-accent-foreground"
        onClick={(event) => {
          event.stopPropagation();
          handleFit();
        }}
        title="Fit to screen (0)"
      >
        <span className="text-xs font-medium">Fit</span>
      </Toggle>

      <Toggle
        variant="outline"
        size="sm"
        pressed={isAt1x}
        className="hover:bg-accent hover:text-accent-foreground"
        onClick={(event) => {
          event.stopPropagation();
          handleOneX();
        }}
        title="Original size (Z)"
      >
        <span className="text-xs font-medium">1x</span>
      </Toggle>

      <div className="bg-border mx-1 w-px" />

      <Toggle
        variant="outline"
        size="sm"
        pressed={false}
        className="hover:bg-accent hover:text-accent-foreground"
        onClick={(event) => {
          event.stopPropagation();
          onCycleBackground();
        }}
        title="Cycle background (B)"
      >
        <IconPalette className="size-4" />
      </Toggle>

      <Toggle
        variant="outline"
        size="sm"
        pressed={isTheater}
        className="hover:bg-accent hover:text-accent-foreground"
        onClick={(event) => {
          event.stopPropagation();
          onToggleTheater();
        }}
        title="Theater mode (T)"
      >
        <IconArrowsMaximize className="size-4" />
      </Toggle>

      <Toggle
        variant="outline"
        size="sm"
        pressed={isFullscreen}
        className="hover:bg-accent hover:text-accent-foreground"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFullscreen();
        }}
        title="Fullscreen (F)"
      >
        <IconMaximize className="size-4" />
      </Toggle>

      <div className="bg-border mx-1 w-px" />

      <Toggle
        variant="outline"
        size="sm"
        pressed={false}
        className="hover:bg-accent hover:text-accent-foreground"
        onClick={(event) => {
          event.stopPropagation();
          onExit();
        }}
        title="Exit viewer (Esc)"
      >
        <IconX className="size-4" />
      </Toggle>
    </div>
  );
}

function OverlayTransformState({
  fitScale,
  onScaleChange,
  onPositionChange,
  onZoomIntentChange,
  onFitChange,
  onOneXChange,
}: {
  fitScale: number;
  onScaleChange: (scale: number) => void;
  onPositionChange: (x: number, y: number) => void;
  onZoomIntentChange: (intent: ZoomIntent) => void;
  onFitChange: (value: boolean) => void;
  onOneXChange: (value: boolean) => void;
}) {
  const isAtFitRef = useRef(false);
  const isAtOneXRef = useRef(false);

  useTransformEffect(({ state }) => {
    onScaleChange(state.scale);
    onPositionChange(state.positionX, state.positionY);
    const isAtFit = isNearScale(state.scale, fitScale);
    const isAt1x = isNearScale(state.scale, 1);

    if (isAtFit !== isAtFitRef.current) {
      isAtFitRef.current = isAtFit;
      onFitChange(isAtFit);
    }

    if (isAt1x !== isAtOneXRef.current) {
      isAtOneXRef.current = isAt1x;
      onOneXChange(isAt1x);
    }

    if (isAtFit) {
      onZoomIntentChange("fit");
      return;
    }

    if (isAt1x) {
      onZoomIntentChange("1x");
      return;
    }

    onZoomIntentChange("free");
  });

  return null;
}

function OverlayAxisCentering({
  containerSize,
  imageNaturalSize,
  isZoomingRef,
  isPanningRef,
}: {
  containerSize: { width: number; height: number };
  imageNaturalSize: { width: number; height: number };
  isZoomingRef: React.MutableRefObject<boolean>;
  isPanningRef: React.MutableRefObject<boolean>;
}) {
  const { setTransform } = useControls();
  const lastAppliedRef = useRef({ x: Number.NaN, y: Number.NaN, scale: 1 });
  const epsilon = 0.5;

  useTransformEffect(({ state }) => {
    if (!isZoomingRef.current || isPanningRef.current) return;
    if (
      containerSize.width === 0 ||
      containerSize.height === 0 ||
      imageNaturalSize.width === 0 ||
      imageNaturalSize.height === 0
    ) {
      return;
    }

    const scaledWidth = imageNaturalSize.width * state.scale;
    const scaledHeight = imageNaturalSize.height * state.scale;
    const centerX = (containerSize.width - scaledWidth) / 2;
    const centerY = (containerSize.height - scaledHeight) / 2;
    let nextX = state.positionX;
    let nextY = state.positionY;

    if (scaledWidth <= containerSize.width + epsilon) {
      nextX = centerX;
    }

    if (scaledHeight <= containerSize.height + epsilon) {
      nextY = centerY;
    }

    if (
      Math.abs(nextX - state.positionX) < epsilon &&
      Math.abs(nextY - state.positionY) < epsilon
    ) {
      return;
    }

    if (
      Math.abs(lastAppliedRef.current.x - nextX) < epsilon &&
      Math.abs(lastAppliedRef.current.y - nextY) < epsilon &&
      Math.abs(lastAppliedRef.current.scale - state.scale) < 0.0001
    ) {
      return;
    }

    lastAppliedRef.current = { x: nextX, y: nextY, scale: state.scale };
    setTransform(nextX, nextY, state.scale, 0, "linear");
  });

  return null;
}

function OverlayFitReset({
  fitScale,
  modeChangeToken,
  onScaleChange,
  onZoomIntentChange,
  isReady,
}: {
  fitScale: number;
  modeChangeToken: number;
  onScaleChange: (scale: number) => void;
  onZoomIntentChange: (intent: ZoomIntent) => void;
  isReady: boolean;
}) {
  const { centerView } = useControls();
  const centerViewRef = useRef(centerView);
  const lastTokenRef = useRef<number | null>(null);

  useEffect(() => {
    centerViewRef.current = centerView;
  }, [centerView]);

  useEffect(() => {
    if (!isReady || fitScale <= 0) return;
    if (lastTokenRef.current === modeChangeToken) return;

    lastTokenRef.current = modeChangeToken;

    onZoomIntentChange("fit");
    onScaleChange(fitScale);
    centerViewRef.current(fitScale, 0, "linear");
  }, [fitScale, isReady, modeChangeToken, onScaleChange, onZoomIntentChange]);

  return null;
}

function OverlayResizeClamp({
  fitScale,
  containerSize,
  getCurrentScale,
  onZoomIntentChange,
  isReady,
}: {
  fitScale: number;
  containerSize: { width: number; height: number };
  getCurrentScale: () => number;
  onZoomIntentChange: (intent: ZoomIntent) => void;
  isReady: boolean;
}) {
  const { centerView } = useControls();
  const centerViewRef = useRef(centerView);
  const lastSizeRef = useRef(containerSize);

  useEffect(() => {
    centerViewRef.current = centerView;
  }, [centerView]);

  useEffect(() => {
    if (!isReady || fitScale <= 0) return;

    const lastSize = lastSizeRef.current;
    const sizeChanged =
      lastSize.width !== containerSize.width ||
      lastSize.height !== containerSize.height;

    if (!sizeChanged) return;

    lastSizeRef.current = containerSize;

    const currentScale = getCurrentScale();
    const nearFit = isNearScale(currentScale, fitScale);
    const nearOneX = isNearScale(currentScale, 1);

    if (currentScale > MAX_ZOOM) {
      centerViewRef.current(MAX_ZOOM, 0, "linear");
      return;
    }

    if (currentScale < fitScale) {
      centerViewRef.current(fitScale, 0, "linear");
      onZoomIntentChange("fit");
      return;
    }

    if (currentScale <= 1 + SCALE_TOLERANCE) {
      const targetScale = nearOneX ? 1 : fitScale;
      centerViewRef.current(targetScale, 0, "linear");
      onZoomIntentChange(targetScale === 1 ? "1x" : "fit");
    } else if (nearFit) {
      centerViewRef.current(fitScale, 0, "linear");
      onZoomIntentChange("fit");
    }
  }, [containerSize, fitScale, getCurrentScale, isReady, onZoomIntentChange]);

  return null;
}

function ZoomBadge() {
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState<number | null>(null);
  const lastScaleRef = useRef(Number.NaN);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  if (!isVisible || scale === null) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center pb-[15vh]">
      <div className="bg-card/90 text-foreground rounded-md px-3 py-2 text-sm font-medium tabular-nums shadow-lg">
        {scale.toFixed(2)}×
      </div>
    </div>
  );
}

function useBackgroundStyles(
  loaded: boolean,
  averageColor: string | undefined,
  imageBackground: ImageBackground,
  fillCanvasBackground: boolean,
) {
  const containerStyle = useMemo(() => {
    if (
      fillCanvasBackground &&
      loaded &&
      imageBackground === "average" &&
      averageColor
    ) {
      return { backgroundColor: averageColor };
    }
    return {};
  }, [fillCanvasBackground, loaded, imageBackground, averageColor]);

  const containerClassName = useMemo(() => {
    if (fillCanvasBackground && loaded) {
      switch (imageBackground) {
        case "checkerboard":
          return "bg-(image:--checkerboard-bg) bg-size-[20px_20px]";
        case "solid":
          return "bg-background";
        case "average":
          return "";
        default:
          return "bg-background";
      }
    }
    return "";
  }, [imageBackground, fillCanvasBackground, loaded]);

  const imageClassName = useMemo(() => {
    if (fillCanvasBackground || !loaded) return "";
    switch (imageBackground) {
      case "checkerboard":
        return "bg-(image:--checkerboard-bg) bg-size-[20px_20px]";
      case "solid":
        return "bg-background";
      case "average":
        return "";
      default:
        return "bg-background";
    }
  }, [imageBackground, fillCanvasBackground, loaded]);

  const imageStyle = useMemo(() => {
    if (
      loaded &&
      !fillCanvasBackground &&
      imageBackground === "average" &&
      averageColor
    ) {
      return { backgroundColor: averageColor };
    }
    return {};
  }, [loaded, fillCanvasBackground, imageBackground, averageColor]);

  return { containerStyle, containerClassName, imageStyle, imageClassName };
}

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

function isNearScale(current: number, target: number): boolean {
  return Math.abs(current - target) <= target * SCALE_TOLERANCE;
}
