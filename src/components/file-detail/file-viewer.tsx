import { useState } from "react";
import { NoSymbolIcon as NoSymbolIconLarge } from "@heroicons/react/24/solid";
import {
  MediaPlayer,
  MediaProvider,
  ToggleButton,
  Tooltip,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { TheatreModeExitIcon, TheatreModeIcon } from "@vidstack/react/icons";
import { useFullFileIdUrl } from "@/hooks/use-url-with-api-key";
import { cn } from "@/lib/utils";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

export function FileViewer({
  fileId,
  mime,
  isDeleted,
}: {
  fileId: number;
  mime: string;
  isDeleted?: boolean;
}) {
  const fileUrl = useFullFileIdUrl(fileId);

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
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isAudio = mime.startsWith("audio/");

  const [isExpanded, setIsExpanded] = useState(false);

  if (isImage) {
    return (
      <div
        className={cn(
          "flex justify-center",
          isExpanded ? "cursor-zoom-out" : "cursor-zoom-in",
        )}
        onClick={() => {
          if (isExpanded) {
            window.scrollTo({ top: 0, behavior: "auto" });
          }
          setIsExpanded(!isExpanded);
        }}
      >
        <img
          src={fileUrl}
          alt={`File ${fileId}`}
          className={cn(
            `max-w-full cursor-pointer rounded border object-contain transition-[max-height] duration-300`,
            isExpanded
              ? "max-h-full cursor-zoom-out"
              : "max-h-[70vh] cursor-zoom-in",
          )}
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="relative flex justify-center pb-4 md:px-8">
        <MediaPlayer
          title={`File ${fileId}`}
          src={fileUrl}
          className={cn(
            isExpanded ? "max-w-full" : "max-w-3xl",
            "max-h-screen",
          )}
        >
          <MediaProvider />
          <DefaultVideoLayout
            icons={defaultLayoutIcons}
            slots={{
              beforeFullscreenButton: (
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <ToggleButton
                      className="vds-button group"
                      aria-label="Theatre Mode"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      <TheatreModeIcon className="vds-icon hidden group-data-pressed:block" />
                      <TheatreModeExitIcon className="vds-icon group-data-pressed:hidden" />
                    </ToggleButton>
                  </Tooltip.Trigger>
                  <Tooltip.Content
                    className="vds-tooltip-content"
                    placement="top start"
                  >
                    {isExpanded ? "Exit Theatre Mode" : "Enter Theatre Mode"}
                  </Tooltip.Content>
                </Tooltip.Root>
              ),
            }}
          />
        </MediaPlayer>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="flex justify-center p-4">
        <audio src={fileUrl} controls className="w-full max-w-md">
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // Fallback for other types - try to embed or show download link
  return (
    <div className="flex flex-col items-center gap-4 rounded border p-8">
      <p className="text-muted-foreground">
        This file type ({mime}) may not be viewable in the browser.
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
