// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from "react";
import {
  useReviewImmersiveMode,
  useReviewSettingsActions,
} from "@/stores/review-settings-store";

/**
 * Side-effect hook for immersive mode: handles Escape key to exit.
 * Call once in the review page component.
 */
export function useReviewImmersiveEffects() {
  const isImmersive = useReviewImmersiveMode();
  const { setImmersiveMode } = useReviewSettingsActions();

  // Escape key exits immersive mode
  useEffect(() => {
    if (!isImmersive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setImmersiveMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isImmersive, setImmersiveMode]);
}
