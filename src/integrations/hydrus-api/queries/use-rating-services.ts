// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo } from "react";
import { ServiceType } from "../models";
import { useGetServicesQuery } from "./services";
import { useRatingsServiceSettings } from "@/stores/ratings-display-settings-store";
import { usePrefetchServiceRatingSvgs } from "./service-rating-svg";

/**
 * Hook that returns rating services from the Hydrus API.
 * Filters to only rating services (like/dislike, numerical, inc/dec).
 * Also prefetches custom SVGs for services with `star_shape: "svg"`.
 */
export function useRatingServices() {
  const { data: servicesData, isLoading, ...rest } = useGetServicesQuery();
  const prefetchSvgs = usePrefetchServiceRatingSvgs();

  const ratingServices = useMemo(() => {
    if (!servicesData?.services) return [];

    return Object.entries(servicesData.services).filter(
      ([, service]) =>
        service.type === ServiceType.RATING_LIKE ||
        service.type === ServiceType.RATING_NUMERICAL ||
        service.type === ServiceType.RATING_INC_DEC,
    );
  }, [servicesData?.services]);

  // Prefetch custom SVG icons for rating services that use them
  useEffect(() => {
    const svgServiceKeys = ratingServices
      .filter(([, service]) => service.star_shape?.toLowerCase() === "svg")
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
