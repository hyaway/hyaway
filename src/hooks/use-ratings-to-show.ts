// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";

import type {
  FileMetadata,
  RatingServiceInfo,
  RatingValue,
} from "@/integrations/hydrus-api/models";
import {
  Permission,
  isIncDecRatingService,
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import {
  useRatingsOverlayMode,
  useRatingsServiceSettings,
  useRatingsSettingsActions,
} from "@/stores/ratings-settings-store";

export interface RatingToShow {
  serviceKey: string;
  service: RatingServiceInfo;
  value: RatingValue;
}

/**
 * Check if a rating service has the optional overlay properties from Hydrus.
 * These properties are only available if the services endpoint returns them.
 */
function hasServiceOverlaySettings(
  service: RatingServiceInfo,
): service is RatingServiceInfo & { show_in_thumbnail: boolean } {
  return typeof service.show_in_thumbnail === "boolean";
}

export function useRatingsToShow(item: FileMetadata): Array<RatingToShow> {
  const { ratingServices } = useRatingServices();
  const serviceSettings = useRatingsServiceSettings();
  const overlayMode = useRatingsOverlayMode();
  const { getServiceSettings } = useRatingsSettingsActions();
  const hasSearchPermission = useHasPermission(
    Permission.SEARCH_FOR_AND_FETCH_FILES,
  );

  // Effective mode: fall back to "custom" if "service" but services don't have overlay properties
  const effectiveMode = useMemo(() => {
    if (overlayMode !== "service" || !hasSearchPermission) return "custom";

    // Check if any rating service has the overlay properties
    const hasOverlaySettings = ratingServices.some(([, service]) =>
      hasServiceOverlaySettings(service),
    );

    return hasOverlaySettings ? "service" : "custom";
  }, [overlayMode, ratingServices, hasSearchPermission]);

  return useMemo(() => {
    if (!item.ratings) return [];

    return ratingServices
      .filter(([serviceKey, service]) => {
        const ratingValue = item.ratings?.[serviceKey];

        // Determine visibility based on mode
        let showInOverlay: boolean;
        let showWhenNull: boolean;

        if (effectiveMode === "service" && hasServiceOverlaySettings(service)) {
          showInOverlay = service.show_in_thumbnail;
          showWhenNull = service.show_in_thumbnail_even_when_null ?? false;
        } else {
          const settings = getServiceSettings(serviceKey);
          showInOverlay = settings.showInOverlay;
          showWhenNull = settings.showInOverlayEvenWhenNull;
        }

        if (!showInOverlay) return false;

        // Check if we should show when null/unset
        if (!showWhenNull) {
          // Like/Dislike: null means unset
          if (isLikeRatingService(service) && ratingValue === null) {
            return false;
          }
          // Numerical: null means unset
          if (isNumericalRatingService(service) && ratingValue === null) {
            return false;
          }
          // Inc/Dec: 0 is treated as "not set" for the second toggle
          if (isIncDecRatingService(service) && ratingValue === 0) {
            return false;
          }
        }

        return true;
      })
      .map(([serviceKey, service]) => ({
        serviceKey,
        service,
        value: item.ratings?.[serviceKey] ?? null,
      }));
  }, [
    ratingServices,
    item.ratings,
    serviceSettings,
    effectiveMode,
    getServiceSettings,
  ]);
}
