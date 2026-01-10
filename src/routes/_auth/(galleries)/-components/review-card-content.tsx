import { useState } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import type { AudioMimeType, VideoMimeType } from "@vidstack/react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";
import { FileStateBadge } from "@/components/file-detail/file-state-badge";
import { BlurhashCanvas } from "@/components/blurhash-canvas";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useFullFileIdUrl } from "@/hooks/use-url-with-api-key";
import { useActiveTheme } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

interface ReviewCardContentProps {
  fileId: number;
}

export function ReviewCardContent({ fileId }: ReviewCardContentProps) {
  const { data: metadata, isPending } = useGetSingleFileMetadata(fileId);
  const { url: fileUrl, onLoad, onError } = useFullFileIdUrl(fileId);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const activeTheme = useActiveTheme();

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

  const handleLoad = () => {
    setLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setError(true);
    onError();
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* Blurhash placeholder */}
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
          className={cn(
            "max-h-full max-w-full object-contain transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
          )}
          draggable={false}
        />
      )}

      {isVideo && (
        <MediaPlayer
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
