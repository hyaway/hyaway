// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";
import { ReviewImageViewer } from "./review-image-viewer";
import type {
  AudioMimeType,
  MediaPlayerInstance,
  VideoMimeType,
} from "@vidstack/react";
import { isImageProjectFile } from "@/lib/mime-utils";

import { FileStateBadge } from "@/components/file-detail/file-state-badge";
import { RatingsOverlay } from "@/components/file-detail/ratings-overlay";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import {
  useLocalWatchHistoryTracker,
  useRemoteFileViewTimeTracker,
} from "@/hooks/use-watch-history-tracking";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useFullFileIdUrl } from "@/hooks/use-url-with-api-key";
import { useActiveTheme } from "@/stores/theme-store";
import { useReviewTrackWatchHistory } from "@/stores/review-queue-store";
import {
  useMediaAutoPlay,
  useMediaStartWithSound,
} from "@/stores/file-viewer-settings-store";
import { cn } from "@/lib/utils";

interface ReviewCardContentProps {
  fileId: number;
  /** Whether this card is the top (active) card in the deck */
  isTop?: boolean;
}

export const ReviewCardContent = memo(function ReviewCardContent({
  fileId,
  isTop = false,
}: ReviewCardContentProps) {
  const { data: metadata, isPending } = useGetSingleFileMetadata(fileId);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const activeTheme = useActiveTheme();

  // Settings
  const mediaAutoPlay = useMediaAutoPlay();
  const mediaStartWithSound = useMediaStartWithSound();
  const trackWatchHistory = useReviewTrackWatchHistory();

  // Media type detection
  // Image project files (PSD, Krita) should be rendered as images via the render endpoint
  const isImage =
    (metadata?.mime.startsWith("image/") ?? false) ||
    (metadata ? isImageProjectFile(metadata.mime) : false);

  // URL for video/audio (images handle their own URLs internally)
  const { url: mediaUrl, onLoad, onError } = useFullFileIdUrl(fileId);

  // Track file view in local watch history (only for top card with valid fileId)
  const shouldTrack = isTop && trackWatchHistory && fileId > 0;
  useLocalWatchHistoryTracker(fileId, shouldTrack);

  // Track view time and sync to Hydrus (only for top card with valid fileId)
  useRemoteFileViewTimeTracker(fileId, shouldTrack);

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

  const isVideo = metadata.mime.startsWith("video/");
  const isAudio = metadata.mime.startsWith("audio/");

  const handleLoad = () => {
    setLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setError(true);
    onError();
  };

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        isVideo && "bg-[oklch(0.145_0_0)]",
      )}
    >
      {/* Media content */}
      {isImage && (
        <ReviewImageViewer
          fileId={fileId}
          mime={metadata.mime}
          width={metadata.width}
          height={metadata.height}
          size={metadata.size}
          numFrames={metadata.num_frames}
          blurhash={metadata.blurhash ?? null}
          isTop={isTop}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {isVideo && isTop && (
        <MediaPlayer
          ref={videoPlayerRef}
          title={`🎞️${fileId}`}
          className={cn(
            "h-full w-full transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
          )}
          src={{ src: mediaUrl, type: metadata.mime as VideoMimeType }}
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
          <MediaProvider
            mediaProps={{
              className: "h-full! w-full! object-contain",
            }}
          />
          <DefaultVideoLayout
            icons={defaultLayoutIcons}
            colorScheme={activeTheme}
            noGestures // Disable gesture handling so our swipe works
            noScrubGesture // Disable scrub gesture on timeline
          />
        </MediaPlayer>
      )}

      {isAudio && isTop && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4">
          <MediaPlayer
            ref={audioPlayerRef}
            title={`🎵${fileId}`}
            className="w-full"
            src={{ src: mediaUrl, type: metadata.mime as AudioMimeType }}
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

      {/* Non-top audio cards show fake player placeholder */}
      {isAudio && !isTop && (
        <div className="flex h-full w-full flex-col items-center justify-center p-4">
          <div className="h-15 w-full rounded-[6px] bg-[rgb(250,250,250)] dark:bg-black" />
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

      {/* Ratings overlay */}
      <div className="absolute top-3 right-3">
        <RatingsOverlay item={metadata} size="md" />
      </div>
    </div>
  );
});
