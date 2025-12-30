import { useCallback, useRef, useState } from "react";

interface VirtualItem {
  index: number;
  lane: number;
  start: number;
}

interface UseMasonryNavigationOptions {
  lanes: number;
  totalItems: number;
  getVirtualItems: () => Array<VirtualItem>;
}

/**
 * Hook for masonry-aware arrow key navigation in a virtualized grid.
 *
 * - Arrow Up/Down: Stay in the same lane, move to previous/next item vertically
 * - Arrow Left/Right: Move to adjacent lane, finding closest item by vertical position
 * - Home/End: Jump to first/last item
 */
export function useMasonryNavigation({
  lanes,
  totalItems,
  getVirtualItems,
}: UseMasonryNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const linkRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());

  const setLinkRef = useCallback(
    (index: number) => (el: HTMLAnchorElement | null) => {
      if (el) {
        linkRefs.current.set(index, el);
      } else {
        linkRefs.current.delete(index);
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!lanes) return;

      const currentIndex = focusedIndex ?? 0;
      const allItems = getVirtualItems();
      const currentItem = allItems.find((v) => v.index === currentIndex);
      if (!currentItem) return;

      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight": {
          // Move to adjacent lane (right), find closest item by vertical position
          const targetLane = (currentItem.lane + 1) % lanes;
          const candidates = allItems.filter((v) => v.lane === targetLane);
          if (candidates.length > 0) {
            // Find the item with the closest start position
            const closest = candidates.reduce((a, b) =>
              Math.abs(b.start - currentItem.start) <
              Math.abs(a.start - currentItem.start)
                ? b
                : a,
            );
            nextIndex = closest.index;
          }
          break;
        }
        case "ArrowLeft": {
          // Move to adjacent lane (left), find closest item by vertical position
          const targetLane = (currentItem.lane - 1 + lanes) % lanes;
          const candidates = allItems.filter((v) => v.lane === targetLane);
          if (candidates.length > 0) {
            const closest = candidates.reduce((a, b) =>
              Math.abs(b.start - currentItem.start) <
              Math.abs(a.start - currentItem.start)
                ? b
                : a,
            );
            nextIndex = closest.index;
          }
          break;
        }
        case "ArrowDown": {
          // Stay in same lane, find next item below
          const candidates = allItems.filter(
            (v) => v.lane === currentItem.lane && v.start > currentItem.start,
          );
          if (candidates.length > 0) {
            // Get the one with smallest start (closest below)
            nextIndex = candidates.reduce((a, b) =>
              b.start < a.start ? b : a,
            ).index;
          }
          break;
        }
        case "ArrowUp": {
          // Stay in same lane, find previous item above
          const candidates = allItems.filter(
            (v) => v.lane === currentItem.lane && v.start < currentItem.start,
          );
          if (candidates.length > 0) {
            // Get the one with largest start (closest above)
            nextIndex = candidates.reduce((a, b) =>
              b.start > a.start ? b : a,
            ).index;
          }
          break;
        }
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = totalItems - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== null && nextIndex !== currentIndex) {
        e.preventDefault();
        setFocusedIndex(nextIndex);
        const nextEl = linkRefs.current.get(nextIndex);
        nextEl?.focus({ preventScroll: true });
        // Use instant scroll when holding key down for faster navigation
        nextEl?.scrollIntoView({
          behavior: e.repeat ? "instant" : "smooth",
          block: "nearest",
        });
      }
    },
    [lanes, focusedIndex, totalItems, getVirtualItems],
  );

  const handleItemFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const getTabIndex = useCallback(
    (index: number) => {
      if (focusedIndex === null) {
        return index === 0 ? 0 : -1;
      }
      return index === focusedIndex ? 0 : -1;
    },
    [focusedIndex],
  );

  return {
    focusedIndex,
    setLinkRef,
    handleKeyDown,
    handleItemFocus,
    getTabIndex,
  };
}
