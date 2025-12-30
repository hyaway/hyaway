import { useCallback, useState } from "react";
import { IconBan, IconFileSad } from "@tabler/icons-react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import type {
  AudioMimeType,
  MediaErrorDetail,
  MediaErrorEvent,
  VideoMimeType,
} from "@vidstack/react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { BlurhashCanvas } from "@/components/blurhash-canvas";
import { useFullFileIdUrl } from "@/hooks/use-url-with-api-key";
import { checkerboardBg, cn } from "@/lib/utils";
import { useActiveTheme } from "@/lib/theme-store";
import {
  useFileViewerStartExpanded,
  useImageBackground,
} from "@/lib/ux-settings-store";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";

export function FileViewer({ data }: { data: FileMetadata }) {
  const { url: fileUrl, onLoad, onError } = useFullFileIdUrl(data.file_id);
  const activeTheme = useActiveTheme();

  // Handle media errors (video/audio) - check for network errors which may be 419
  const onMediaError = useCallback(
    (error: MediaErrorDetail, _nativeEvent: MediaErrorEvent) => {
      // MEDIA_ERR_NETWORK (2) or MEDIA_ERR_SRC_NOT_SUPPORTED (4) could be 419
      if (error.code === 2 || error.code === 4) {
        onError();
      }
    },
    [onError],
  );

  const isDeleted = data.is_deleted && !data.is_trashed;

  if (isDeleted) {
    return (
      <div className="relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-sm border p-8">
        {data.blurhash && (
          <BlurhashCanvas
            blurhash={data.blurhash}
            width={32}
            height={32}
            className="absolute inset-0 h-full w-full"
          />
        )}
        <div className="relative z-10 flex flex-col items-center gap-4 rounded-sm bg-black/50 p-8 text-white backdrop-blur-xs">
          <IconBan className="size-12" />
          <p>This file has been deleted and is no longer available.</p>
        </div>
      </div>
    );
  }

  // Determine file type from MIME
  const isImage = data.mime.startsWith("image/");
  const isVideo = data.mime.startsWith("video/");
  const isAudio = data.mime.startsWith("audio/");

  const startExpanded = useFileViewerStartExpanded();
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const [loaded, setLoaded] = useState(false);
  const imageBackground = useImageBackground();

  const handleLoad = () => {
    setLoaded(true);
    onLoad();
  };

  if (isImage) {
    return (
      <div className="flex justify-center pb-2 sm:pb-4">
        <img
          src={fileUrl}
          alt={`File ${data.file_id}`}
          loading="eager"
          className={cn(
            "max-w-full cursor-pointer object-contain transition-[max-height] duration-300",
            loaded && imageBackground === "checkerboard"
              ? checkerboardBg
              : "bg-background",
            isExpanded
              ? "max-h-full cursor-zoom-out"
              : "short:max-h-[60vh] max-h-[70vh] cursor-zoom-in",
          )}
          onLoad={handleLoad}
          onError={onError}
          onClick={() => {
            if (isExpanded) {
              window.scrollTo({ top: 0, behavior: "auto" });
            }
            setIsExpanded(!isExpanded);
          }}
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="short:max-h-[60svh] flex max-h-[70svh] flex-row justify-center pb-2 sm:px-4 sm:pb-4">
        <MediaPlayer
          title={`File ${data.file_id}`}
          src={{ src: fileUrl, type: data.mime as VideoMimeType }}
          playsInline
          crossOrigin={true}
          onCanPlay={onLoad}
          onError={onMediaError}
        >
          <MediaProvider
            mediaProps={{
              className: "h-full!",
            }}
          />
          <DefaultVideoLayout
            icons={defaultLayoutIcons}
            colorScheme={activeTheme}
          />
        </MediaPlayer>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="short:max-h-[60svh] flex max-h-[70svh] flex-row justify-center pb-2 sm:px-4 sm:pb-4">
        <MediaPlayer
          title={`File ${data.file_id}`}
          src={{ src: fileUrl, type: data.mime as AudioMimeType }}
          playsInline
          crossOrigin={true}
          onCanPlay={onLoad}
          onError={onMediaError}
        >
          <MediaProvider />
          <DefaultAudioLayout
            icons={defaultLayoutIcons}
            colorScheme={activeTheme}
          />
        </MediaPlayer>
      </div>
    );
  }

  // Fallback for other types - try to embed or show download link
  return (
    <div className="flex flex-col items-center gap-4 rounded border p-8">
      <IconFileSad stroke={1.5} className="text-muted-foreground size-12" />
      <p className="text-muted-foreground">
        This file type ({data.mime}) is not currently viewable inline.
      </p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline"
      >
        Open file in new tab
      </a>
    </div>
  );
}
