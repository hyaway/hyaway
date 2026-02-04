// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo } from "react";
import { isRatingService } from "../models";
import { useGetServicesQuery } from "./services";
import { usePrefetchServiceRatingSvgs } from "./service-rating-svg";
import type { RatingServiceInfo, ServiceInfo } from "../models";
import { useRatingsServiceSettings } from "@/stores/ratings-settings-store";

/**
 * Type guard for rating services with overlay settings from Hydrus.
 */
function hasServiceOverlaySettings(
  service: ServiceInfo,
): service is RatingServiceInfo & { show_in_thumbnail: boolean } {
  return typeof (service as RatingServiceInfo).show_in_thumbnail === "boolean";
}

/**
 * Hook that returns rating services from the Hydrus API.
 * Filters to only rating services (like/dislike, numerical, inc/dec).
 * Also prefetches custom SVGs for services with `star_shape: "svg"`.
 */
export function useRatingServices() {
  const { data: servicesData, isLoading, ...rest } = useGetServicesQuery();
  const prefetchSvgs = usePrefetchServiceRatingSvgs();

  const ratingServices = useMemo((): Array<[string, RatingServiceInfo]> => {
    if (!servicesData?.services) return [];

    return Object.entries(servicesData.services).filter(
      (entry): entry is [string, RatingServiceInfo] =>
        isRatingService(entry[1]),
    );
  }, [servicesData?.services]);

  // Prefetch custom SVG icons for rating services that use them
  useEffect(() => {
    const svgServiceKeys = ratingServices
      .filter(([, service]) => service.star_shape === "svg")
      .map(([key]) => key);

    if (svgServiceKeys.length > 0) {
      prefetchSvgs(svgServiceKeys);
    }
  }, [ratingServices, prefetchSvgs]);

  return {
    ratingServices,
    isLoading,
    ...rest,
  };
}

/**
 * Hook that returns whether there are any rating services available or
 * orphaned service settings (to show settings UI for cleanup).
 */
export function useHasRatingServices() {
  const { ratingServices, isLoading } = useRatingServices();
  const ratingsServiceSettings = useRatingsServiceSettings();

  // Check for orphaned services (in settings but no longer in Hydrus)
  const hasOrphanedServices = useMemo(() => {
    const activeServiceKeys = new Set(ratingServices.map(([key]) => key));
    return Object.keys(ratingsServiceSettings).some(
      (key) => !activeServiceKeys.has(key),
    );
  }, [ratingServices, ratingsServiceSettings]);

  // Show settings if we have rating services OR orphaned settings to clean up
  if (isLoading) return false;
  return ratingServices.length > 0 || hasOrphanedServices;
}

/**
 * Hook that returns whether any rating service has the overlay settings
 * (show_in_thumbnail, show_in_thumbnail_even_when_null) from Hydrus.
 * This is used to determine if the "Hydrus" option should be available.
 */
export function useHasServiceOverlaySettings(): boolean {
  const { ratingServices, isLoading, isFetched } = useRatingServices();

  return useMemo(() => {
    // Don't show as available until we've fetched
    if (isLoading || !isFetched) return false;
    return ratingServices.some(([, service]) =>
      hasServiceOverlaySettings(service),
    );
  }, [ratingServices, isLoading, isFetched]);
}
