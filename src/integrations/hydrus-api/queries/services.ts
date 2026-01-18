// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from "@tanstack/react-query";
import { getServices } from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { ServiceType } from "../models";

export const useGetServicesQuery = () => {
  const isConfigured = useIsApiConfigured();

  return useQuery({
    queryKey: ["getServices"],
    queryFn: async () => {
      return getServices();
    },
    enabled: isConfigured,
  });
};

export const useAllKnownTagsServiceQuery = () => {
  const servicesQuery = useGetServicesQuery();
  if (servicesQuery.data) {
    const servicesList = Object.entries(servicesQuery.data.services);
    const allKnownTagsService = servicesList.find(
      (service) => service[1].type === ServiceType.ALL_KNOWN_TAGS,
    )?.[0];
    return { ...servicesQuery, data: allKnownTagsService };
  }
  return servicesQuery;
};
