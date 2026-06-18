// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getServices } from "../api-client";
import { selectLocalTagServices } from "../tag-actions";
import { useIsApiConfigured } from "../hydrus-config-store";
import { ServiceType } from "../models";
import type { ServiceInfo } from "../models";

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

/** Local (writable) tag services as [key, service] entries. */
export const useLocalTagServices = (): Array<[string, ServiceInfo]> => {
  const { data } = useGetServicesQuery();
  return useMemo(() => selectLocalTagServices(data?.services), [data?.services]);
};
