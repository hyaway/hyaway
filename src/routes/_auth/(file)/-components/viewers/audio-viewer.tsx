import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import type { AudioMimeType } from "@vidstack/react";
import { useActiveTheme } from "@/lib/theme-store";
import { cn } from "@/lib/utils";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";

interface AudioViewerProps {
  fileUrl: string;
  fileId: number;
  mime: string;
  onLoad: () => void;
  onError: () => void;
}

export function AudioViewer({
  fileUrl,
  fileId,
  mime,
  onLoad,
  onError,
}: AudioViewerProps) {
  const activeTheme = useActiveTheme();

  return (
    <div
      className={cn(
        // Full available max-height minus header, footer, and content padding
        "short:max-h-[calc(100svh-var(--header-height-short)-var(--footer-height-short)-1.5rem)] max-h-[calc(100svh-var(--header-height)-var(--footer-height)-2rem)]",
        "flex flex-row justify-center pb-2 sm:px-4 sm:pb-4",
      )}
    >
      <MediaPlayer
        title={`File ${fileId}`}
        src={{ src: fileUrl, type: mime as AudioMimeType }}
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
        <MediaProvider />
        <DefaultAudioLayout
          icons={defaultLayoutIcons}
          colorScheme={activeTheme}
        />
      </MediaPlayer>
    </div>
  );
}
