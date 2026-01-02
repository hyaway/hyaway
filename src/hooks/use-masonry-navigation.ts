import { useEffect, useRef, useState } from "react";

interface VirtualItem {
  index: number;
  lane: number;
  start: number;
}

interface ScrollToIndexOptions {
  align?: "start" | "center" | "end" | "auto";
  behavior?: "auto" | "smooth";
}

interface UseMasonryNavigationOptions {
  lanes: number;
  totalItems: number;
  getVirtualItems: () => Array<VirtualItem>;
  scrollToIndex?: (index: number, options?: ScrollToIndexOptions) => void;
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
  scrollToIndex,
}: UseMasonryNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const pendingFocusRef = useRef<number | null>(null);
  const linkRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());

  // Stable ref callback that handles both setting refs and pending focus
  const setLinkRef = (el: HTMLAnchorElement | null, index: number) => {
    if (el) {
      linkRefs.current.set(index, el);
      // If this is the element we're waiting to focus, focus it now
      if (pendingFocusRef.current === index) {
        pendingFocusRef.current = null;
        el.focus({ preventScroll: true });
      }
    } else {
      linkRefs.current.delete(index);
    }
  };

  // Effect to focus pending element after it's rendered
  useEffect(() => {
    if (pendingFocusRef.current !== null) {
      const el = linkRefs.current.get(pendingFocusRef.current);
      if (el) {
        el.focus({ preventScroll: true });
        pendingFocusRef.current = null;
      }
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      if (nextEl) {
        // Element is in DOM, focus directly
        nextEl.focus({ preventScroll: true });
        nextEl.scrollIntoView({
          behavior: e.repeat ? "instant" : "smooth",
          block: "nearest",
        });
      } else if (scrollToIndex) {
        // Element is virtualized away, scroll to bring it into view
        pendingFocusRef.current = nextIndex;
        scrollToIndex(nextIndex, {
          align: "auto",
          behavior: e.repeat ? "auto" : "smooth",
        });
      }
    }
  };

  /**
   * Get the tabIndex for a given item. Pass the array of currently visible
   * indices so we can fall back to the first visible item when the focused
   * item is virtualized away.
   */
  const getTabIndex = (index: number, visibleIndices: Array<number>) => {
    const target = focusedIndex ?? 0;

    // If the focused item is visible, only it gets tabIndex=0
    if (visibleIndices.includes(target)) {
      return index === target ? 0 : -1;
    }

    // Focused item is off-screen, make the first visible item tabbable
    const firstVisible = Math.min(...visibleIndices);
    return index === firstVisible ? 0 : -1;
  };

  return {
    focusedIndex,
    setLinkRef,
    handleKeyDown,
    handleItemFocus: setFocusedIndex,
    getTabIndex,
  };
}
