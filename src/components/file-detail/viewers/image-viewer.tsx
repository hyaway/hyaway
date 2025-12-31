import { useState } from "react";
import { cn } from "@/lib/utils";
import { checkerboardBg } from "@/lib/style-constants";
import {
  useFileViewerStartExpanded,
  useImageBackground,
} from "@/lib/ux-settings-store";

interface ImageViewerProps {
  fileUrl: string;
  fileId: number;
  onLoad: () => void;
  onError: () => void;
}

export function ImageViewer({
  fileUrl,
  fileId,
  onLoad,
  onError,
}: ImageViewerProps) {
  const startExpanded = useFileViewerStartExpanded();
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const [loaded, setLoaded] = useState(false);
  const imageBackground = useImageBackground();

  const handleLoad = () => {
    setLoaded(true);
    onLoad();
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        isExpanded
          ? "short:min-h-[calc(100svh-var(--header-height-short)-var(--footer-height-short)-1rem)] min-h-[calc(100svh-var(--header-height)-var(--footer-height)-2rem)]"
          : "short:h-[calc(100svh-var(--header-height-short)-var(--footer-height-short)-1rem)] h-[calc(100svh-var(--header-height)-var(--footer-height)-2rem)]",
      )}
    >
      <img
        src={fileUrl}
        alt={`File ${fileId}`}
        loading="eager"
        className={cn(
          "max-h-full max-w-full object-contain",
          loaded && imageBackground === "checkerboard"
            ? checkerboardBg
            : "bg-background",
          isExpanded ? "cursor-zoom-out" : "cursor-zoom-in",
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
