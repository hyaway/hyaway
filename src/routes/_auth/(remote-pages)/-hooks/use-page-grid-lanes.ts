import { useLayoutEffect, useState } from "react";
import type { RefObject } from "react";

export const PAGE_CARD_WIDTH = 192; // 12rem
export const PAGE_CARD_HEIGHT = 240; // PAGE_CARD_WIDTH + 48
export const PAGE_CARD_GAP = 16; // gap-4

/**
 * Hook to calculate the number of lanes for a pages grid item grid based on container width.
 * Simplified version of useResponsiveLanes for fixed-size pages grid items.
 */
export function usePageGridLanes(
  containerRef: RefObject<HTMLElement | null>,
  maxColumns: number,
  maxItems: number = Infinity,
) {
  const [lanes, setLanes] = useState(1);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const containerWidth = entries[0].contentRect.width;
      const calculatedLanes = Math.max(
        1,
        Math.floor(
          (containerWidth + PAGE_CARD_GAP) / (PAGE_CARD_WIDTH + PAGE_CARD_GAP),
        ),
      );
      setLanes(Math.min(calculatedLanes, maxColumns, maxItems));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, maxColumns, maxItems]);

  return lanes;
}
