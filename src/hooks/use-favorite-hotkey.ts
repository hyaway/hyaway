// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useEffectEvent, useMemo } from "react";
import { toast } from "sonner";
import { Permission } from "@/integrations/hydrus-api/models";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useEditableRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useSetRatingMutation } from "@/integrations/hydrus-api/queries/ratings";
import { resolveFavoriteService } from "@/lib/resolve-favorite-service";
import { shouldIgnoreKeyboardEvent } from "@/lib/keyboard-utils";

/**
 * Registers the `s` hotkey in the file viewer to toggle the favourite
 * (like/dislike) rating on the current file. Inert when there is no
 * like/dislike rating service or the key lacks the Edit Ratings permission.
 */
export function useFavoriteHotkey(fileId: number) {
  const { ratingServices } = useEditableRatingServices();
  const { hasPermission } = usePermissions();
  const canEditRatings = hasPermission(Permission.EDIT_FILE_RATINGS);
  const { mutate: setRating } = useSetRatingMutation();
  const { data: metadata } = useGetSingleFileMetadata(fileId);

  const favorite = useMemo(
    () => resolveFavoriteService(ratingServices),
    [ratingServices],
  );

  const onToggleFavorite = useEffectEvent(() => {
    if (!favorite || !canEditRatings) return;
    const [serviceKey, service] = favorite;
    const current = metadata?.ratings?.[serviceKey] ?? null;
    const nextLiked = current !== true;
    setRating({
      file_id: fileId,
      rating_service_key: serviceKey,
      rating: nextLiked ? true : null,
    });
    toast(nextLiked ? "★ Favourited" : "Removed favourite", {
      description: service.name,
      duration: 1500,
    });
  });

  const enabled = favorite !== null && canEditRatings;

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
