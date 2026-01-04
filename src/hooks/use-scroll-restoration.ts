import { useElementScrollRestoration } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { dispatchScrollRestoration } from "./use-scroll-direction";

// Re-export for convenience
export { useElementScrollRestoration };

/**
 * Hook to handle scroll restoration for virtualized lists.
 * Scrolls the window once the virtualizer has enough content.
 *
 * Usage:
 * ```tsx
 * const scrollEntry = useElementScrollRestoration({ getElement: () => window });
 * const initialOffset = scrollEntry?.scrollY;
 *
 * const virtualizer = useWindowVirtualizer({
 *   initialOffset,
 *   // ...other options
 * });
 *
 * useScrollRestoration(virtualizer.getTotalSize(), initialOffset);
 * ```
 */
export function useScrollRestoration(
  totalSize: number,
  scrollY: number | undefined,
): void {
  const restoredRef = useRef(false);

  // Scroll the window once the virtualizer has enough height
  // Use useEffect (not useLayoutEffect) to run after paint
  useEffect(() => {
    if (restoredRef.current || !scrollY || scrollY <= 0) {
      return;
    }

    // Wait until virtualizer has calculated enough height to scroll to
    if (totalSize < scrollY) {
      return;
    }

    restoredRef.current = true;

    // Use double rAF to ensure scroll happens after browser's scroll restoration
    // and after the virtualizer has rendered its items
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dispatchScrollRestoration();
        window.scrollTo(0, scrollY);
      });
    });
  }, [scrollY, totalSize]);
}
