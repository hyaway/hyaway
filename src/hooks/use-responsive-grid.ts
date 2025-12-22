import { startTransition, useLayoutEffect, useState } from "react";

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
  const [gridState, setGridState] = useState({
    width: defaultWidth,
    desiredLanes: 0,
  });

  const { width, desiredLanes } = gridState;
  const lanes =
    itemCount < desiredLanes ? Math.max(itemCount, 2) : desiredLanes;

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const newLanes = Math.max(
        2,
        Math.floor(entry.contentRect.width / (defaultWidth + 4)),
      );
      const newWidth =
        newLanes < 3 ? entry.contentRect.width / newLanes - 4 : defaultWidth;

      startTransition(() => {
        setGridState({ width: newWidth, desiredLanes: newLanes });
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [defaultWidth, containerRef]);

  return { width, lanes };
}
