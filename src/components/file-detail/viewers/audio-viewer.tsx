import { useState } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";
import { viewerFixedHeight } from "./style-constants";
import type { AudioMimeType } from "@vidstack/react";
import { useActiveTheme } from "@/stores/theme-store";
import { cn } from "@/lib/utils";
import {
  useMediaAutoPlay,
  useMediaStartWithSound,
} from "@/stores/file-viewer-settings-store";

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

  // Get settings from store - only use initial values on mount
  const mediaAutoPlay = useMediaAutoPlay();
  const mediaStartWithSound = useMediaStartWithSound();

  // Capture initial values so settings changes don't affect mounted player
  const [initialSettings] = useState(() => ({
    autoPlay: mediaAutoPlay,
    muted: !mediaStartWithSound,
  }));

  return (
    <div className={cn("flex items-center justify-center", viewerFixedHeight)}>
      <MediaPlayer
        title={`🎵${fileId}`}
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
        autoPlay={initialSettings.autoPlay}
        muted={initialSettings.muted}
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
