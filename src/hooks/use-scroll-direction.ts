import { useEffect, useRef, useState } from "react";

// Custom event for scroll restoration
export const SCROLL_RESTORATION_EVENT = "app:scroll-restoration";

export function dispatchScrollRestoration() {
  window.dispatchEvent(new CustomEvent(SCROLL_RESTORATION_EVENT));
}

/**
 * Hook that tracks scroll direction and returns visibility state.
 * Useful for hiding/showing or fading UI elements based on scroll.
 *
 * @param threshold - Minimum scroll difference to trigger state change (reduces jitter)
 * @returns isVisible - true when scrolling up or at top, false when scrolling down
 */
export function useScrollDirection(threshold = 10) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const skipNextScroll = useRef(false);

  useEffect(() => {
    // Initialize with current scroll position
    lastScrollY.current = window.scrollY;

    const handleScrollRestoration = () => {
      // Skip the next scroll event and keep header visible
      skipNextScroll.current = true;
      setIsVisible(true);
      // Update lastScrollY to prevent hiding on next scroll
      lastScrollY.current = window.scrollY;
    };

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      // Skip if scroll restoration just happened
      if (skipNextScroll.current) {
        skipNextScroll.current = false;
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      // Ignore if only horizontal scroll occurred
      if (scrollY === lastScrollY.current) {
        ticking.current = false;
        return;
      }

      // Always show header when at the top
      if (scrollY < threshold) {
        setIsVisible(true);
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      const diff = scrollY - lastScrollY.current;

      // Only update if scroll difference exceeds threshold (reduces jitter)
      if (Math.abs(diff) >= threshold) {
        setIsVisible(diff < 0); // Scrolling up = visible
        lastScrollY.current = scrollY;
      }

      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDir);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener(SCROLL_RESTORATION_EVENT, handleScrollRestoration);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener(
        SCROLL_RESTORATION_EVENT,
        handleScrollRestoration,
      );
    };
  }, [threshold]);

  return isVisible;
}
