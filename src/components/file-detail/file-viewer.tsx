import { useState } from "react";
import {
  FaceFrownIcon,
  NoSymbolIcon as NoSymbolIconLarge,
} from "@heroicons/react/24/solid";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import type { AudioMimeType, VideoMimeType } from "@vidstack/react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { useFullFileIdUrl } from "@/hooks/use-url-with-api-key";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/lib/theme-store";
import { useFileViewerStartExpanded } from "@/lib/ux-settings-store";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";

export function FileViewer({ data }: { data: FileMetadata }) {
  const fileUrl = useFullFileIdUrl(data.file_id);
  const activeTheme = useActiveTheme();

  const isDeleted = data.is_deleted && !data.is_trashed;

  if (isDeleted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded border p-8">
        <NoSymbolIconLarge className="text-muted-foreground size-12" />
        <p className="text-muted-foreground">
          This file has been deleted and is no longer available.
        </p>
      </div>
    );
  }

  // Determine file type from MIME
  const isImage = data.mime.startsWith("image/");
  const isVideo = data.mime.startsWith("video/");
  const isAudio = data.mime.startsWith("audio/");

  const startExpanded = useFileViewerStartExpanded();
  const [isExpanded, setIsExpanded] = useState(startExpanded);

  if (isImage) {
    return (
      <div className="flex justify-center pb-4">
        <img
          src={fileUrl}
          alt={`File ${data.file_id}`}
          loading="eager"
          className={cn(
            `max-w-full cursor-pointer object-contain transition-[max-height] duration-300`,
            isExpanded
              ? "max-h-full cursor-zoom-out"
              : "max-h-[70vh] cursor-zoom-in",
          )}
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
      <div className="flex max-h-[70svh] flex-row justify-center pb-4 sm:px-4">
        <MediaPlayer
          title={`File ${data.file_id}`}
          src={{ src: fileUrl, type: data.mime as VideoMimeType }}
          playsInline
          crossOrigin={true}
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
      <div className="flex max-h-[70svh] flex-row justify-center pb-4 sm:px-4">
        <MediaPlayer
          title={`File ${data.file_id}`}
          src={{ src: fileUrl, type: data.mime as AudioMimeType }}
          playsInline
          crossOrigin={true}
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
      <FaceFrownIcon className="text-muted-foreground size-12" />
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
