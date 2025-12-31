import { useState } from "react";
import { VIEWER_MAX_HEIGHT } from "./viewer-styles";
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
    <div className="flex justify-center pb-2 sm:pb-4">
      <img
        src={fileUrl}
        alt={`File ${fileId}`}
        loading="eager"
        className={cn(
          "max-w-full cursor-pointer object-contain transition-[max-height] duration-300",
          loaded && imageBackground === "checkerboard"
            ? checkerboardBg
            : "bg-background",
          isExpanded
            ? "max-h-full cursor-zoom-out"
            : cn(VIEWER_MAX_HEIGHT, "cursor-zoom-in"),
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
