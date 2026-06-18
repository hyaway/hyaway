// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getServices } from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { ServiceType } from "../models";
import type { LocalTagServiceInfo } from "../models";

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

export type LocalTagServiceEntry = [string, LocalTagServiceInfo];

export const useLocalTagServices = () => {
  const servicesQuery = useGetServicesQuery();

  const entries = useMemo(
    () =>
      servicesQuery.data
        ? Object.entries(servicesQuery.data.services).filter(
            (entry): entry is LocalTagServiceEntry =>
              entry[1].type === ServiceType.LOCAL_TAG_DOMAIN,
          )
        : [],
    [servicesQuery.data],
  );

  const localTagServicesByKey = useMemo(() => new Map(entries), [entries]);

  return {
    ...servicesQuery,
    localTagServices: entries,
    localTagServicesByKey,
  };
};
