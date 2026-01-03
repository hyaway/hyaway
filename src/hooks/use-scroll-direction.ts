import { useEffect, useRef, useState } from "react";

// Custom event for scroll restoration
export const SCROLL_RESTORATION_EVENT = "app:scroll-restoration";

export function dispatchScrollRestoration() {
  window.dispatchEvent(new CustomEvent(SCROLL_RESTORATION_EVENT));
}

/**
 * Hook that tracks scroll direction and returns visibility state.
 * Ignores scroll events triggered by window resize.
 *
 * @param threshold - Minimum scroll difference to trigger state change (reduces jitter)
 * @returns isVisible - true when scrolling up or at top, false when scrolling down
 */
export function useScrollDirection(threshold = 10) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const skipNextScroll = useRef(false);
  const ignoreUntil = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScrollRestoration = () => {
      skipNextScroll.current = true;
      setIsVisible(true);
      lastScrollY.current = window.scrollY;
    };

    // Ignore scroll events briefly after resize
    const handleResize = () => {
      ignoreUntil.current = Date.now() + 200;
      lastScrollY.current = window.scrollY;
    };

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      if (skipNextScroll.current) {
        skipNextScroll.current = false;
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      // Ignore scroll events during resize cooldown
      if (Date.now() < ignoreUntil.current) {
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      if (scrollY === lastScrollY.current) {
        ticking.current = false;
        return;
      }

      if (scrollY < threshold) {
        setIsVisible(true);
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      // Show when at bottom of page (with small tolerance for overscroll)
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollY >= maxScroll - 70 - threshold) {
        console.log("at bottom");
        setIsVisible(true);
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      const diff = scrollY - lastScrollY.current;
      if (Math.abs(diff) >= threshold) {
        setIsVisible(diff < 0);
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
    window.addEventListener("resize", handleResize);
    window.addEventListener(SCROLL_RESTORATION_EVENT, handleScrollRestoration);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(
        SCROLL_RESTORATION_EVENT,
        handleScrollRestoration,
      );
    };
  }, [threshold]);

  return isVisible;
}
