import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Tooltip,
  useMediaPlayer,
  useMediaState,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { viewerFixedHeight, viewerMaxHeight } from "./style-constants";
import type { VideoMimeType } from "@vidstack/react";
import { useActiveTheme } from "@/stores/theme-store";
import { cn } from "@/lib/utils";
import {
  useMediaAutoPlay,
  useMediaStartWithSound,
  useVideoStartExpanded,
} from "@/stores/file-viewer-settings-store";

interface VideoViewerProps {
  fileUrl: string;
  fileId: number;
  mime: string;
  onLoad: () => void;
  onError: () => void;
}

// Vidstack control button for zoom/fit toggle
function ZoomButton({
  zoomFill,
  onToggle,
}: {
  zoomFill: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          className="vds-button"
          onClick={onToggle}
          aria-label={zoomFill ? "Fit to container" : "Zoom to fill"}
        >
          {zoomFill ? (
            <IconZoomOut className="size-[26px]" />
          ) : (
            <IconZoomIn className="size-[26px]" />
          )}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content className="vds-tooltip-content" placement="top">
        {zoomFill ? "Fit" : "Zoom"}
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

// Vidstack control button for theater mode toggle
function TheaterButton({
  isTheater,
  onToggle,
}: {
  isTheater: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          className="vds-button"
          onClick={onToggle}
          aria-label={isTheater ? "Exit theater mode" : "Theater mode"}
        >
          {isTheater ? (
            <IconArrowsMinimize className="size-[26px]" />
          ) : (
            <IconArrowsMaximize className="size-[26px]" />
          )}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content className="vds-tooltip-content" placement="top">
        {isTheater ? "Exit theater" : "Theater"}
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

// Inner component that can access MediaPlayer context
function VideoPlayerInner({
  zoomFill,
  isTheater,
  onZoomToggle,
  onTheaterToggle,
  activeTheme,
}: {
  zoomFill: boolean;
  isTheater: boolean;
  onZoomToggle: () => void;
  onTheaterToggle: () => void;
  activeTheme: "light" | "dark" | "system";
}) {
  const player = useMediaPlayer();
  const isFullscreen = useMediaState("fullscreen");

  // Memoize slots to prevent re-renders
  const slots = useMemo(
    () => ({
      beforeFullscreenButton: (
        <>
          <ZoomButton zoomFill={zoomFill} onToggle={onZoomToggle} />
          <TheaterButton
            isTheater={isTheater}
            onToggle={() => {
              // If in fullscreen, exit first then enter theater
              if (isFullscreen && player) {
                player.exitFullscreen().then(onTheaterToggle);
              } else {
                onTheaterToggle();
              }
            }}
          />
        </>
      ),
    }),
    [zoomFill, isTheater, onZoomToggle, onTheaterToggle, player, isFullscreen],
  );

  return (
    <DefaultVideoLayout
      icons={defaultLayoutIcons}
      colorScheme={activeTheme}
      slots={slots}
    />
  );
}

export function VideoViewer({
  fileUrl,
  fileId,
  mime,
  onLoad,
  onError,
}: VideoViewerProps) {
  const activeTheme = useActiveTheme();

  const containerRef = useRef<HTMLDivElement>(null);

  // Theater mode (null = normal view)
  const [isTheater, setIsTheater] = useState(false);

  // Get settings from store - only use initial values on mount
  const videoStartExpanded = useVideoStartExpanded();
  const mediaAutoPlay = useMediaAutoPlay();
  const mediaStartWithSound = useMediaStartWithSound();

  // When enabled, upscale to use the available viewer area ("zoom")
  const [zoomFill, setZoomFill] = useState(() => videoStartExpanded);

  // Capture initial values so settings changes don't affect mounted player
  const [initialSettings] = useState(() => ({
    autoPlay: mediaAutoPlay,
    muted: !mediaStartWithSound,
  }));

  const toggleTheater = useCallback(() => {
    setIsTheater((prev) => !prev);
  }, []);

  const toggleZoom = useCallback(() => {
    setZoomFill((prev) => !prev);
  }, []);

  // Escape key exits theater mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTheater) {
        setIsTheater(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTheater]);

  // Disable body scroll in theater mode
  useEffect(() => {
    if (isTheater) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isTheater]);

  const getContainerClass = () => {
    if (isTheater) {
      return "fixed inset-0 z-50 bg-black/95";
    }
    return viewerFixedHeight;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative flex items-center justify-center",
        getContainerClass(),
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center",
          zoomFill ? "h-full w-full" : viewerMaxHeight,
        )}
      >
        <MediaPlayer
          title={`🎞️${fileId}`}
          src={{ src: fileUrl, type: mime as VideoMimeType }}
          playsInline
          crossOrigin={true}
          onCanPlay={onLoad}
          onError={(error) => {
            // MEDIA_ERR_NETWORK (2) or MEDIA_ERR_SRC_NOT_SUPPORTED (4) could be 419
            if (error.code === 2 || error.code === 4) {
              onError();
            }
          }}
          autoPlay={initialSettings.autoPlay}
          muted={initialSettings.muted}
          className={cn(zoomFill && "h-full w-full", "max-h-full max-w-full")}
        >
          <MediaProvider
            mediaProps={{
              className: cn(
                zoomFill
                  ? "h-full! w-full! object-contain"
                  : "max-h-full! max-w-full! object-contain",
              ),
            }}
          />
          <VideoPlayerInner
            zoomFill={zoomFill}
            isTheater={isTheater}
            onZoomToggle={toggleZoom}
            onTheaterToggle={toggleTheater}
            activeTheme={activeTheme}
          />
        </MediaPlayer>
      </div>
    </div>
  );
}
