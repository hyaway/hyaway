// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { shouldIgnoreKeyboardEvent } from "@/lib/keyboard-utils";

/**
 * Registers the `s` hotkey in the file viewer to toggle the favourite
 * (like/dislike) rating on the current file, with toast feedback. Inert when
 * there is no like/dislike rating service or the key lacks the Edit Ratings
 * permission.
 */
export function useFavoriteHotkey(fileId: number) {
  const { enabled, toggle } = useFavoriteToggle(fileId);

  const onToggleFavorite = useEffectEvent(() => {
    const result = toggle();
    if (!result) return;
    toast(result.nextLiked ? "★ Favourited" : "Removed favourite", {
      description: result.serviceName,
      duration: 1500,
    });
  });

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyboardEvent(event, { checkOverlays: true })) return;
      if (event.key !== "s" && event.key !== "S") return;
      event.preventDefault();
      onToggleFavorite();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
