// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useEffectEvent } from "react";
import type { SwipeDirection } from "./review-swipe-card";
import { useReviewShortcutsEnabled } from "@/stores/review-settings-store";
import { shouldIgnoreKeyboardEvent } from "@/lib/keyboard-utils";

/**
 * Registers keyboard shortcuts for review swipe actions.
 * Uses `useEffectEvent` so the listener is stable and only
 * re-subscribes when the shortcuts toggle changes.
 */
export function useReviewKeyboardShortcuts(
  onSwipe: (direction: SwipeDirection) => void,
  onUndo: () => void,
) {
  const shortcutsEnabled = useReviewShortcutsEnabled();

  const onSwipeKey = useEffectEvent((direction: SwipeDirection) => {
    onSwipe(direction);
  });
  const onUndoKey = useEffectEvent(() => {
    onUndo();
  });

  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeyboardEvent(e, { checkOverlays: true })) return;

      switch (e.key) {
        case "ArrowLeft":
        case "h":
        case "H":
          e.preventDefault();
          onSwipeKey("left");
          break;
        case "ArrowRight":
        case "l":
        case "L":
          e.preventDefault();
          onSwipeKey("right");
          break;
        case "ArrowUp":
        case "k":
        case "K":
          e.preventDefault();
          onSwipeKey("up");
          break;
        case "ArrowDown":
        case "j":
        case "J":
          e.preventDefault();
          onSwipeKey("down");
          break;
        case "z":
        case "Z":
        case "Backspace":
          e.preventDefault();
          onUndoKey();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutsEnabled]);
}
