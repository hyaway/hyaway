import { useState } from "react";
import { viewerFixedHeight, viewerMinHeight } from "./style-constants";
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
        isExpanded ? viewerMinHeight : viewerFixedHeight,
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
