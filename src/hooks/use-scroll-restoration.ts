import { useElementScrollRestoration } from "@tanstack/react-router";
import { useLayoutEffect, useState } from "react";
import { dispatchScrollRestoration } from "./use-scroll-direction";

/**
 * Hook to handle scroll restoration for virtualized lists.
 * Waits until the container has enough height before restoring scroll position.
 */
export function useScrollRestoration(totalSize: number) {
  const scrollEntry = useElementScrollRestoration({
    getElement: () => window,
  });

  const [scrollRestored, setScrollRestored] = useState(false);

  useLayoutEffect(() => {
    if (scrollRestored || !scrollEntry?.scrollY || scrollEntry.scrollY <= 0) {
      return;
    }

    // Wait until virtualizer has calculated enough height to scroll to
    if (totalSize < scrollEntry.scrollY) {
      return;
    }

    dispatchScrollRestoration();
    window.scrollTo(0, scrollEntry.scrollY);
    setScrollRestored(true);
  }, [scrollEntry?.scrollY, scrollRestored, totalSize]);
}
