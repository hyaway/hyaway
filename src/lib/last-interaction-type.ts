// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";

/**
 * Tracks whether the most recent user interaction was keyboard or pointer/touch.
 *
 * Returns a stable ref whose `.current` value updates synchronously on every
 * `keydown` or `pointerdown` — no re-renders, no state.
 *
 * Listeners are registered on mount and cleaned up on unmount, so the hook
 * is safe for HMR and conditional rendering.
 */

export type InteractionType = "keyboard" | "pointer";

const LISTENER_OPTIONS = { capture: true, passive: true } as const;

export function useLastInteractionType() {
  const ref = useRef<InteractionType>("pointer");

  useEffect(() => {
    function onKeydown() {
      ref.current = "keyboard";
    }
    function onPointerdown() {
      ref.current = "pointer";
    }

    window.addEventListener("keydown", onKeydown, LISTENER_OPTIONS);
    window.addEventListener("pointerdown", onPointerdown, LISTENER_OPTIONS);
    return () => {
      window.removeEventListener("keydown", onKeydown, LISTENER_OPTIONS);
      window.removeEventListener(
        "pointerdown",
        onPointerdown,
        LISTENER_OPTIONS,
      );
    };
  }, []);

  return { ref } as const;
}
