// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import type { ImageBackground } from "@/stores/file-viewer-settings-store";
import { useImageBackground } from "@/stores/file-viewer-settings-store";

const BACKGROUND_ORDER = ["solid", "checkerboard", "average"] as const;

/**
 * Hook for managing image background with local override capability.
 *
 * Provides a local override that cycles through background modes while
 * automatically resetting when the global setting changes.
 *
 * @returns Object with:
 * - `imageBackground`: The effective background (local override or global)
 * - `cycleImageBackground`: Callback to cycle to the next background mode
 */
export function useImageBackgroundCycle() {
  const globalImageBackground = useImageBackground();

  // Local override for image background - allows per-image toggling
  const [backgroundOverride, setBackgroundOverride] =
    useState<ImageBackground | null>(null);
  const imageBackground = backgroundOverride ?? globalImageBackground;

  // Sync background override when global setting changes
  useEffect(() => {
    setBackgroundOverride(null);
  }, [globalImageBackground]);

  // Cycle through background modes: solid -> checkerboard -> average -> solid
  const cycleImageBackground = useCallback(() => {
    const currentIndex = BACKGROUND_ORDER.indexOf(imageBackground);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % BACKGROUND_ORDER.length;
    setBackgroundOverride(BACKGROUND_ORDER[nextIndex]);
  }, [imageBackground]);

  return {
    imageBackground,
    cycleImageBackground,
  };
}
