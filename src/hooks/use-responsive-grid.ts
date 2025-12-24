import { startTransition, useLayoutEffect, useState } from "react";
import { useGridExpandImages, useGridMaxLanes } from "@/lib/ux-settings-store";

interface GridState {
  width: number;
  lanes: number;
}

/**
 * Hook to calculate responsive grid dimensions based on container width.
 * Returns the item width and number of lanes.
 */
export function useResponsiveGrid(
  containerRef: React.RefObject<HTMLElement | null>,
  defaultWidth: number,
  itemCount: number,
): GridState {
  const maxLanes = useGridMaxLanes();
  const expandImages = useGridExpandImages();

  const [gridState, setGridState] = useState({
    width: defaultWidth,
    desiredLanes: 0,
  });

  const { width, desiredLanes } = gridState;
  const clampedLanes = Math.min(desiredLanes, maxLanes);
  const lanes =
    itemCount < clampedLanes ? Math.max(itemCount, 2) : clampedLanes;

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const calculatedLanes = Math.max(
        2,
        Math.floor(entry.contentRect.width / (defaultWidth + 4)),
      );
      const newLanes = Math.min(calculatedLanes, maxLanes);
      const shouldExpand = expandImages || calculatedLanes < 3;
      const newWidth = shouldExpand
        ? entry.contentRect.width / newLanes - 4
        : defaultWidth;

      startTransition(() => {
        setGridState({ width: newWidth, desiredLanes: calculatedLanes });
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [defaultWidth, containerRef, maxLanes, expandImages]);

  return { width, lanes };
}
