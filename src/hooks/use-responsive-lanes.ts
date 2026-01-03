import { useLayoutEffect, useState } from "react";
import {
  useGalleryExpandImages,
  useGalleryHorizontalGap,
  useGalleryMaxLanes,
  useGalleryMinLanes,
} from "@/stores/gallery-settings-store";

interface ResponsiveLanesState {
  /** Calculated item width in pixels */
  width: number;
  /** Number of lanes (columns). Returns 0 before initial measurement. */
  lanes: number;
  /** Max grid width when not expanding images */
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
 * Calculate responsive lane dimensions based on container width.
 *
 * ## Layout Shift Prevention
 * - Returns `lanes: 0` before initial measurement to signal loading state
 * - Performs synchronous measurement in useLayoutEffect before first paint
 * - Callers should show a skeleton/placeholder when `lanes === 0`
 *
 * ## Animation Stability
 * - Only triggers state updates when lanes or containerWidth actually change
 * - Width is floored to whole pixels to prevent sub-pixel jitter
 * - Callers should key height caches on `lanes`, not `width`, to avoid
 *   re-layout during continuous resize when expandImages is enabled
 */
function calculateLanes(
  containerWidth: number,
  defaultWidth: number,
  horizontalGap: number,
): number {
  return Math.max(
    1,
    Math.floor(containerWidth / (defaultWidth + horizontalGap)),
  );
}

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

    // Synchronous measurement before paint to avoid layout shift
    const initialWidth = containerRef.current.clientWidth;
    if (initialWidth > 0) {
      setGridState((prev) => {
        if (prev.containerWidth !== 0) return prev; // Already measured
        return {
          width: defaultWidth,
          desiredLanes: calculateLanes(
            initialWidth,
            defaultWidth,
            horizontalGap,
          ),
          containerWidth: initialWidth,
        };
      });
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const containerWidth = entry.contentRect.width;
      const calculatedLanes = calculateLanes(
        containerWidth,
        defaultWidth,
        horizontalGap,
      );

      // Only update state if lanes or containerWidth actually changed
      setGridState((prev) => {
        if (
          prev.desiredLanes === calculatedLanes &&
          prev.containerWidth === containerWidth
        ) {
          return prev;
        }
        return {
          width: defaultWidth,
          desiredLanes: calculatedLanes,
          containerWidth,
        };
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [defaultWidth, containerRef, horizontalGap]);

  const { desiredLanes, containerWidth } = gridState;

  // Not measured yet - return lanes: 0 to signal caller should wait
  if (containerWidth === 0) {
    return { width: defaultWidth, lanes: 0, maxWidth: undefined };
  }

  // Apply min/max lanes constraints
  const constrainedLanes = Math.max(minLanes, Math.min(desiredLanes, maxLanes));

  // Check if minLanes forced more lanes than would naturally fit
  const minLanesForced = desiredLanes < minLanes;

  // Calculate width based on whether we're expanding or minLanes forced expansion
  // Round to prevent sub-pixel jitter during resize
  const newWidth =
    expandImages || minLanesForced
      ? Math.floor(containerWidth / constrainedLanes - horizontalGap)
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
