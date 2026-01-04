import { useMemo, useState } from "react";
import { viewerFixedHeight, viewerMinHeight } from "./style-constants";
import { cn } from "@/lib/utils";
import { getAverageColorFromBlurhash } from "@/lib/color-utils";
import {
  useFileViewerStartExpanded,
  useImageBackground,
} from "@/stores/file-viewer-settings-store";

interface ImageViewerProps {
  fileUrl: string;
  fileId: number;
  blurhash?: string;
  onLoad: () => void;
  onError: () => void;
}

export function ImageViewer({
  fileUrl,
  fileId,
  blurhash,
  onLoad,
  onError,
}: ImageViewerProps) {
  const startExpanded = useFileViewerStartExpanded();
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const [loaded, setLoaded] = useState(false);
  const imageBackground = useImageBackground();

  const averageColor = useMemo(
    () => getAverageColorFromBlurhash(blurhash),
    [blurhash],
  );

  const handleLoad = () => {
    setLoaded(true);
    onLoad();
  };

  // Determine background style based on setting
  const getBackgroundClass = () => {
    if (!loaded) return "bg-background";
    switch (imageBackground) {
      case "checkerboard":
        return "bg-(image:--checkerboard-bg) bg-size-[20px_20px]";
      case "average":
        return ""; // Handled via inline style
      default:
        return "bg-background";
    }
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
          getBackgroundClass(),
          isExpanded ? "cursor-zoom-out" : "cursor-zoom-in",
        )}
        style={
          loaded && imageBackground === "average" && averageColor
            ? { backgroundColor: averageColor }
            : undefined
        }
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
