// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createContext, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Context for tracking global touch count across the window.
 * Useful for detecting multi-touch gestures (like pinch zoom) even when
 * touches are on different elements.
 */

type TouchCountGetter = () => number;

const GlobalTouchCountContext = createContext<TouchCountGetter | null>(null);

export function GlobalTouchCountProvider({
  children,
}: {
  children: ReactNode;
}) {
  const touchCountRef = useRef(0);

  useEffect(() => {
    const updateTouchCount = (e: TouchEvent) => {
      touchCountRef.current = e.touches.length;
    };

    window.addEventListener("touchstart", updateTouchCount, { passive: true });
    window.addEventListener("touchend", updateTouchCount, { passive: true });
    window.addEventListener("touchcancel", updateTouchCount, { passive: true });

    return () => {
      window.removeEventListener("touchstart", updateTouchCount);
      window.removeEventListener("touchend", updateTouchCount);
      window.removeEventListener("touchcancel", updateTouchCount);
    };
  }, []);

  const getTouchCount = () => touchCountRef.current;

  return (
    <GlobalTouchCountContext.Provider value={getTouchCount}>
      {children}
    </GlobalTouchCountContext.Provider>
  );
}

/**
 * Returns a function to get the current global touch count.
 * Returns 0 if used outside of GlobalTouchCountProvider.
 */
export function useGlobalTouchCount(): TouchCountGetter {
  const getTouchCount = useContext(GlobalTouchCountContext);
  return getTouchCount ?? (() => 0);
}
