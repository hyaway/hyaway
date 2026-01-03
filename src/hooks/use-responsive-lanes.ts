import { startTransition, useLayoutEffect, useState } from "react";
import {
  useGalleryExpandImages,
  useGalleryMaxLanes,
} from "@/lib/settings-store";

interface ResponsiveLanesState {
  width: number;
  lanes: number;
}

interface UseResponsiveLanesOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  defaultWidth: number;
  itemCount: number;
  maxLanes: number;
  expandImages: boolean;
}

/**
 * Generic hook to calculate responsive lane dimensions based on container width.
 * Returns the item width and number of lanes.
 */
export function useResponsiveLanes(
  options: UseResponsiveLanesOptions,
): ResponsiveLanesState {
  const { containerRef, defaultWidth, itemCount, maxLanes, expandImages } =
    options;

  const [gridState, setGridState] = useState({
    width: defaultWidth,
    desiredLanes: 0,
  });

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const calculatedLanes = Math.max(
        1,
        Math.floor(entry.contentRect.width / (defaultWidth + 4)),
      );
      const newLanes = Math.min(calculatedLanes, maxLanes);
      const newWidth = expandImages
        ? entry.contentRect.width / newLanes - 4
        : defaultWidth - 4;

      startTransition(() => {
        setGridState({ width: newWidth, desiredLanes: calculatedLanes });
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [defaultWidth, containerRef, maxLanes, expandImages]);

  const { width, desiredLanes } = gridState;
  const clampedLanes = Math.min(desiredLanes, maxLanes);
  const lanes =
    itemCount < clampedLanes ? Math.max(itemCount, 2) : clampedLanes;

  return { width, lanes };
}

/**
 * Gallery-specific hook that uses gallery settings for responsive lanes.
 */
export function useGalleryResponsiveLanes(
  containerRef: React.RefObject<HTMLElement | null>,
  defaultWidth: number,
  itemCount: number,
): ResponsiveLanesState {
  const maxLanes = useGalleryMaxLanes();
  const expandImages = useGalleryExpandImages();

  return useResponsiveLanes({
    containerRef,
    defaultWidth,
    itemCount,
    maxLanes,
    expandImages,
  });
}
