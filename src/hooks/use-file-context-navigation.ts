// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { toast } from "sonner";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import { shouldIgnoreKeyboardEvent } from "@/lib/keyboard-utils";
import { useGlobalTouchCount } from "@/lib/global-touch-count";

/** Minimum horizontal distance (px) to trigger a swipe */
const SWIPE_THRESHOLD = 80;
/** Maximum vertical distance (px) allowed during horizontal swipe */
const VERTICAL_TOLERANCE = 100;
/** Minimum velocity (px/ms) to trigger a swipe even below threshold */
const VELOCITY_THRESHOLD = 0.5;

export interface FileContextNavigationOptions {
  /** The current file ID being viewed */
  fileId: number;
  /** The list of file IDs in the current context (gallery/page) */
  fileIds: Array<number> | undefined;
  /** Whether the context is still loading */
  isLoading: boolean;
  /** Whether there was an error loading the context */
  isError: boolean;
  /** Route path for navigating to a file in this context, e.g., "/recently-trashed/$fileId" */
  contextRoute: string;
  /** Function to build route params for a given fileId */
  buildParams: (fileId: number) => Record<string, string>;
}

export interface FileContextNavigationResult {
  /** Actions for prev/next navigation to add to footer */
  navActions: Array<FloatingFooterAction>;
  /** Whether we should redirect to the fallback route */
  shouldFallback: boolean;
  /** Current position in the list (1-indexed) */
  currentPosition: number | null;
  /** Total count of files in context */
  totalCount: number;
}

/**
 * Hook to manage prev/next navigation within a gallery/page context.
 *
 * When the context can't be loaded or the file isn't in the list,
 * it signals that the route should redirect to /file/$fileId.
 */
export function useFileContextNavigation({
  fileId,
  fileIds,
  isLoading,
  isError,
  contextRoute,
  buildParams,
}: FileContextNavigationOptions): FileContextNavigationResult {
  const navigate = useNavigate();
  const getGlobalTouchCount = useGlobalTouchCount();

  const currentIndex = fileIds?.indexOf(fileId) ?? -1;
  const prevId = currentIndex > 0 ? fileIds![currentIndex - 1] : null;
  const nextId =
    fileIds && currentIndex >= 0 && currentIndex < fileIds.length - 1
      ? fileIds[currentIndex + 1]
      : null;

  // Determine if we should fallback to /file/$fileId
  const shouldFallback = isLoading
    ? false
    : isError
      ? true
      : fileIds && currentIndex === -1
        ? true
        : false;

  // Perform the fallback redirect
  useEffect(() => {
    if (shouldFallback) {
      navigate({
        to: "/file/$fileId",
        params: { fileId: String(fileId) },
        replace: true,
      });
    }
  }, [shouldFallback, fileId, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyboardEvent(event)) return;

      if (event.key === "[" || event.key === "{") {
        if (prevId === null) return;
        event.preventDefault();
        navigate({
          to: contextRoute,
          params: buildParams(prevId),
          replace: true,
        });
        return;
      }

      if (event.key === "]" || event.key === "}") {
        if (nextId === null) return;
        event.preventDefault();
        navigate({
          to: contextRoute,
          params: buildParams(nextId),
          replace: true,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [buildParams, contextRoute, navigate, nextId, prevId]);

  // Swipe gesture navigation
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    identifier: number;
  } | null>(null);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      // Don't swipe when in fullscreen mode (video player, image theater)
      if (document.fullscreenElement) {
        touchStartRef.current = null;
        return;
      }

      // Only track single-finger touches for swipe
      if (event.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        identifier: touch.identifier,
      };
      hasNavigatedRef.current = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      // Abort if in fullscreen mode
      if (document.fullscreenElement) {
        touchStartRef.current = null;
        return;
      }

      // Abort if multiple fingers (pinch/zoom gesture)
      if (getGlobalTouchCount() > 1 || event.touches.length > 1) {
        touchStartRef.current = null;
        return;
      }

      const start = touchStartRef.current;
      if (!start || hasNavigatedRef.current) return;

      // Find the touch we're tracking
      const touch = Array.from(event.touches).find(
        (t) => t.identifier === start.identifier,
      );
      if (!touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const elapsed = Date.now() - start.time;
      const velocity = Math.abs(deltaX) / Math.max(elapsed, 1);

      // If vertical movement exceeds tolerance, abort (user is scrolling)
      if (Math.abs(deltaY) > VERTICAL_TOLERANCE) {
        touchStartRef.current = null;
        return;
      }

      // Check if swipe threshold or velocity threshold is met
      const meetsDistanceThreshold = Math.abs(deltaX) >= SWIPE_THRESHOLD;
      const meetsVelocityThreshold =
        velocity >= VELOCITY_THRESHOLD && Math.abs(deltaX) >= 40;

      if (meetsDistanceThreshold || meetsVelocityThreshold) {
        if (deltaX > 0) {
          if (prevId !== null) {
            // Swipe right → go to previous
            hasNavigatedRef.current = true;
            navigate({
              to: contextRoute,
              params: buildParams(prevId),
              replace: true,
            });
          } else {
            // At first item, show feedback
            hasNavigatedRef.current = true;
            toast("No previous file", { duration: 1500 });
          }
        } else if (deltaX < 0) {
          if (nextId !== null) {
            // Swipe left → go to next
            hasNavigatedRef.current = true;
            navigate({
              to: contextRoute,
              params: buildParams(nextId),
              replace: true,
            });
          } else {
            // At last item, show feedback
            hasNavigatedRef.current = true;
            toast("No next file", { duration: 1500 });
          }
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [
    buildParams,
    contextRoute,
    getGlobalTouchCount,
    navigate,
    nextId,
    prevId,
  ]);

  const navActions: Array<FloatingFooterAction> = [
    {
      id: "nav-prev",
      label: "Previous",
      icon: IconChevronLeft,
      title: "Previous file ( [])",
      onClick: () => {
        if (prevId !== null) {
          navigate({
            to: contextRoute,
            params: buildParams(prevId),
            replace: true,
          });
        }
      },
      disabled: prevId === null,
    },
    {
      id: "nav-next",
      label: "Next",
      icon: IconChevronRight,
      title: "Next file ( ] )",
      onClick: () => {
        if (nextId !== null) {
          navigate({
            to: contextRoute,
            params: buildParams(nextId),
            replace: true,
          });
        }
      },
      disabled: nextId === null,
    },
  ];

  return {
    navActions,
    shouldFallback,
    currentPosition: currentIndex >= 0 ? currentIndex + 1 : null,
    totalCount: fileIds?.length ?? 0,
  };
}
