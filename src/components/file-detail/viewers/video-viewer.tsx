import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import type { VideoMimeType } from "@vidstack/react";
import { useActiveTheme } from "@/lib/theme-store";
import { cn } from "@/lib/utils";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

interface VideoViewerProps {
  fileUrl: string;
  fileId: number;
  mime: string;
  onLoad: () => void;
  onError: () => void;
}

export function VideoViewer({
  fileUrl,
  fileId,
  mime,
  onLoad,
  onError,
}: VideoViewerProps) {
  const activeTheme = useActiveTheme();

  return (
    <div
      className={cn(
        // Full available max-height minus header, footer, main padding-top, and small buffer
        "short:max-h-[calc(100svh-var(--header-height-short)-var(--footer-height-short)-1rem)] max-h-[calc(100svh-var(--header-height)-var(--footer-height)-2rem)]",
        "flex flex-row justify-center",
      )}
    >
      <MediaPlayer
        title={`File ${fileId}`}
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
