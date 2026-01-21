// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { ServiceType } from "../models";
import { useGetServicesQuery } from "./services";

/**
 * Hook that returns rating services from the Hydrus API.
 * Filters to only rating services (like/dislike, numerical, inc/dec).
 */
export function useRatingServices() {
  const { data: servicesData, isLoading, ...rest } = useGetServicesQuery();

  const ratingServices = useMemo(() => {
    if (!servicesData?.services) return [];

    return Object.entries(servicesData.services).filter(
      ([, service]) =>
        service.type === ServiceType.RATING_LIKE ||
        service.type === ServiceType.RATING_NUMERICAL ||
        service.type === ServiceType.RATING_INC_DEC,
    );
  }, [servicesData?.services]);

  return {
    ratingServices,
    isLoading,
    ...rest,
  };
}
