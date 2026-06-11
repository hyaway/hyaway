// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type {
  LikeRatingServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import { isLikeRatingService } from "@/integrations/hydrus-api/models";

/** A service key paired with its like/dislike service. */
export type FavoriteService = [string, LikeRatingServiceInfo];

/**
 * Pick the like/dislike rating service to use for the favourite hotkey.
 *
 * The caller passes the *editable* rating services (read-only ones already
 * filtered out). Keep only like/dislike services. When more than one exists,
 * prefer the one named "favourites"/"favorites" (case-insensitive); otherwise
 * take the first like/dislike service. Returns null when there is none.
 */
export function resolveFavoriteService(
  services: Array<[string, RatingServiceInfo]>,
): FavoriteService | null {
  const likeServices = services.filter(
    (entry): entry is FavoriteService => isLikeRatingService(entry[1]),
  );

  if (likeServices.length === 0) return null;

  const named = likeServices.find(([, service]) => {
    const name = service.name.trim().toLowerCase();
    return name === "favourites" || name === "favorites";
  });

  return named ?? likeServices[0];
}
