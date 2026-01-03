import { startTransition, useLayoutEffect, useState } from "react";
import {
  useGalleryExpandImages,
  useGalleryHorizontalGap,
  useGalleryMaxLanes,
  useGalleryMinLanes,
} from "@/lib/settings-store";

interface ResponsiveLanesState {
  width: number;
  lanes: number;
  maxWidth: number | undefined;
}

interface UseResponsiveLanesOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  defaultWidth: number;
  itemCount: number;
  minLanes: number;
  maxLanes: number;
  expandImages: boolean;
  horizontalGap: number;
}

/**
 * Generic hook to calculate responsive lane dimensions based on container width.
 * Returns the item width and number of lanes.
 */
export function useResponsiveLanes(
  options: UseResponsiveLanesOptions,
): ResponsiveLanesState {
  const {
    containerRef,
    defaultWidth,
    itemCount,
    minLanes,
    maxLanes,
    expandImages,
    horizontalGap,
  } = options;

  const [gridState, setGridState] = useState({
    width: defaultWidth,
    desiredLanes: 0,
    containerWidth: 0,
  });

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const containerWidth = entry.contentRect.width;
      const calculatedLanes = Math.max(
        1,
        Math.floor(containerWidth / (defaultWidth + horizontalGap)),
      );

      startTransition(() => {
        setGridState({
          width: defaultWidth,
          desiredLanes: calculatedLanes,
          containerWidth,
        });
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [defaultWidth, containerRef, horizontalGap]);

  const { desiredLanes, containerWidth } = gridState;

  // Apply min/max lanes constraints
  const constrainedLanes = Math.max(minLanes, Math.min(desiredLanes, maxLanes));

  // Check if minLanes forced more lanes than would naturally fit
  const minLanesForced = desiredLanes < minLanes;

  // Calculate width based on whether we're expanding or minLanes forced expansion
  const newWidth =
    expandImages || minLanesForced
      ? containerWidth / constrainedLanes - horizontalGap
      : defaultWidth - horizontalGap;

  // Clamp lanes based on item count
  const lanes =
    itemCount < constrainedLanes ? Math.max(itemCount, 2) : constrainedLanes;

  const finalWidth = newWidth > 0 ? newWidth : defaultWidth;

  // maxWidth constrains the grid when not expanding images
  const maxWidth = !expandImages
    ? maxLanes * (finalWidth + horizontalGap)
    : undefined;

  return { width: finalWidth, lanes, maxWidth };
}

/**
 * Gallery-specific hook that uses gallery settings for responsive lanes.
 * Accepts optional overrides for values that should be deferred.
 */
export function useGalleryResponsiveLanes(
  containerRef: React.RefObject<HTMLElement | null>,
  defaultWidth: number,
  itemCount: number,
  overrides?: { horizontalGap?: number },
): ResponsiveLanesState {
  const minLanes = useGalleryMinLanes();
  const maxLanes = useGalleryMaxLanes();
  const expandImages = useGalleryExpandImages();
  const storeHorizontalGap = useGalleryHorizontalGap();

  return useResponsiveLanes({
    containerRef,
    defaultWidth,
    itemCount,
    minLanes,
    maxLanes,
    expandImages,
    horizontalGap: overrides?.horizontalGap ?? storeHorizontalGap,
  });
}
