import { useEffect, useMemo, useRef, useState } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import type {
  AudioMimeType,
  MediaPlayerInstance,
  VideoMimeType,
} from "@vidstack/react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";
import { FileStateBadge } from "@/components/file-detail/file-state-badge";
import { BlurhashCanvas } from "@/components/blurhash-canvas";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useFullFileIdUrl } from "@/hooks/use-url-with-api-key";
import { useActiveTheme } from "@/stores/theme-store";
import {
  useFillCanvasBackground,
  useImageBackground,
  useMediaAutoPlay,
  useMediaStartWithSound,
} from "@/stores/file-viewer-settings-store";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

interface ReviewCardContentProps {
  fileId: number;
  /** Whether this card is the top (active) card in the deck */
  isTop?: boolean;
}

export function ReviewCardContent({
  fileId,
  isTop = false,
}: ReviewCardContentProps) {
  const { data: metadata, isPending } = useGetSingleFileMetadata(fileId);
  const { url: fileUrl, onLoad, onError } = useFullFileIdUrl(fileId);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const activeTheme = useActiveTheme();

  // Settings
  const imageBackground = useImageBackground();
  const fillCanvasBackground = useFillCanvasBackground();
  const mediaAutoPlay = useMediaAutoPlay();
  const mediaStartWithSound = useMediaStartWithSound();

  // Player refs for controlling playback when becoming top card
  const videoPlayerRef = useRef<MediaPlayerInstance>(null);
  const audioPlayerRef = useRef<MediaPlayerInstance>(null);

  // Play/pause when becoming/leaving top card
  useEffect(() => {
    if (!mediaAutoPlay) return;

    const player = videoPlayerRef.current ?? audioPlayerRef.current;
    if (!player) return;

    if (isTop && loaded) {
      player.play();
    } else {
      player.pause();
    }
  }, [isTop, loaded, mediaAutoPlay]);

  if (isPending) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-center">
        <p>File not found</p>
      </div>
    );
  }

  const isImage = metadata.mime.startsWith("image/");
  const isVideo = metadata.mime.startsWith("video/");
  const isAudio = metadata.mime.startsWith("audio/");

  // Compute average color from blurhash for image backgrounds
  const averageColor = useMemo(
    () => getAverageColorFromBlurhash(metadata.blurhash ?? undefined),
    [metadata.blurhash],
  );

  const handleLoad = () => {
    setLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setError(true);
    onError();
  };

  // Compute background style for images (only when fillCanvasBackground is enabled)
  const getContainerBackgroundClass = () => {
    if (!isImage || !fillCanvasBackground || !loaded) return "";
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

  // Container background style (for fill canvas with average color)
  const getContainerStyle = () => {
    if (
      isImage &&
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

  // Image background style (for average color when not using fill canvas)
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
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        getContainerBackgroundClass(),
      )}
      style={getContainerStyle()}
    >
      {/* Blurhash placeholder - only while loading */}
      {metadata.blurhash && !loaded && !error && (
        <BlurhashCanvas
          blurhash={metadata.blurhash}
          className="absolute inset-0 h-full w-full"
        />
      )}

      {/* Media content */}
      {isImage && (
        <img
          src={fileUrl}
          alt={`File ${fileId}`}
          onLoad={handleLoad}
          onError={handleError}
          style={getImageStyle()}
          className={cn(
            "max-h-full max-w-full object-contain transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
            getImageBackgroundClass(),
          )}
          draggable={false}
        />
      )}

      {isVideo && (
        <MediaPlayer
          ref={videoPlayerRef}
          title={`🎞️${fileId}`}
          className={cn(
            "max-h-full max-w-full transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
          )}
          src={{ src: fileUrl, type: metadata.mime as VideoMimeType }}
          playsInline
          crossOrigin={true}
          onCanPlay={handleLoad}
          onError={(err) => {
            if (err.code === 2 || err.code === 4) handleError();
          }}
          draggable={false}
          muted={!mediaStartWithSound}
          loop
        >
          <MediaProvider />
          <DefaultVideoLayout
            icons={defaultLayoutIcons}
            colorScheme={activeTheme}
          />
        </MediaPlayer>
      )}

      {isAudio && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4">
          <MediaPlayer
            ref={audioPlayerRef}
            title={`🎵${fileId}`}
            className="w-full"
            src={{ src: fileUrl, type: metadata.mime as AudioMimeType }}
            playsInline
            crossOrigin={true}
            onCanPlay={handleLoad}
            onError={(err) => {
              if (err.code === 2 || err.code === 4) handleError();
            }}
            draggable={false}
            muted={!mediaStartWithSound}
            loop
          >
            <MediaProvider />
            <DefaultAudioLayout
              icons={defaultLayoutIcons}
              colorScheme={activeTheme}
            />
          </MediaPlayer>
        </div>
      )}

      {!isImage && !isVideo && !isAudio && (
        <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2 p-4">
          <p className="text-lg font-medium">Unsupported file type</p>
          <p className="text-sm">{metadata.mime}</p>
        </div>
      )}

      {error && (
        <div className="text-destructive absolute inset-0 flex items-center justify-center bg-black/50">
          <p>Failed to load media</p>
        </div>
      )}

      {/* File state badge overlay */}
      <div className="absolute top-3 left-3">
        <FileStateBadge data={metadata} />
      </div>
    </div>
  );
}
