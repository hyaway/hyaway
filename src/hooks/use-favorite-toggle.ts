// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo } from "react";
import { Permission } from "@/integrations/hydrus-api/models";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useEditableRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useSetRatingMutation } from "@/integrations/hydrus-api/queries/ratings";
import { resolveFavoriteService } from "@/lib/resolve-favorite-service";

/** Result of a favourite toggle: the new liked state + service name (for feedback). */
export interface FavoriteToggleResult {
  nextLiked: boolean;
  serviceName: string;
}

/**
 * Shared favourite (like/dislike) state + toggle for the current file.
 *
 * Resolves the like/dislike "favourites" service, exposes whether it is
 * currently liked, and a toggle that flips liked <-> cleared. `enabled` is
 * false (and toggle is a no-op) when there is no like/dislike service or the
 * key lacks the Edit Ratings permission.
 */
export function useFavoriteToggle(fileId: number) {
  const { ratingServices } = useEditableRatingServices();
  const { hasPermission } = usePermissions();
  const canEditRatings = hasPermission(Permission.EDIT_FILE_RATINGS);
  const { mutate: setRating } = useSetRatingMutation();
  const { data: metadata } = useGetSingleFileMetadata(fileId);

  const favorite = useMemo(
    () => resolveFavoriteService(ratingServices),
    [ratingServices],
  );

  const enabled = favorite !== null && canEditRatings;
  const isLiked =
    favorite !== null && (metadata?.ratings?.[favorite[0]] ?? null) === true;

  const toggle = useCallback((): FavoriteToggleResult | undefined => {
    if (!favorite || !canEditRatings) return undefined;
    const [serviceKey, service] = favorite;
    const current = metadata?.ratings?.[serviceKey] ?? null;
    const nextLiked = current !== true;
    setRating({
      file_id: fileId,
      rating_service_key: serviceKey,
      rating: nextLiked ? true : null,
    });
    return { nextLiked, serviceName: service.name };
  }, [favorite, canEditRatings, metadata, setRating, fileId]);

  return { enabled, isLiked, toggle };
}
