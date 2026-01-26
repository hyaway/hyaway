// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";

import type {
  FileMetadata,
  RatingValue,
  ServiceInfo,
} from "@/integrations/hydrus-api/models";
import { ServiceType } from "@/integrations/hydrus-api/models";
import { useGetServicesQuery } from "@/integrations/hydrus-api/queries/services";
import {
  useRatingsSettingsActions,
  useRatingsServiceSettings,
} from "@/stores/ratings-settings-store";

export interface RatingToShow {
  serviceKey: string;
  service: ServiceInfo;
  value: RatingValue;
}

export function useRatingsToShow(item: FileMetadata): Array<RatingToShow> {
  const { data: servicesData } = useGetServicesQuery();
  const serviceSettings = useRatingsServiceSettings();
  const { getServiceSettings } = useRatingsSettingsActions();

  return useMemo(() => {
    if (!servicesData?.services || !item.ratings) return [];

    return Object.entries(servicesData.services)
      .filter(([serviceKey, service]) => {
        // Only rating services
        if (
          service.type !== ServiceType.RATING_LIKE &&
          service.type !== ServiceType.RATING_NUMERICAL &&
          service.type !== ServiceType.RATING_INC_DEC
        ) {
          return false;
        }

        const settings = getServiceSettings(serviceKey);
        if (!settings.showInOverlay) return false;

        const ratingValue = item.ratings?.[serviceKey];

        // Check if we should show when null/unset
        if (!settings.showInOverlayEvenWhenNull) {
          // Like/Dislike: null means unset
          if (
            service.type === ServiceType.RATING_LIKE &&
            ratingValue === null
          ) {
            return false;
          }
          // Numerical: null means unset
          if (
            service.type === ServiceType.RATING_NUMERICAL &&
            ratingValue === null
          ) {
            return false;
          }
          // Inc/Dec: 0 is treated as "not set" for the second toggle
          if (
            service.type === ServiceType.RATING_INC_DEC &&
            ratingValue === 0
          ) {
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
    servicesData?.services,
    item.ratings,
    serviceSettings,
    getServiceSettings,
  ]);
}
