import { useQuery } from "@tanstack/react-query";
import { getServices } from "../api-client";
import { useSessionKeyHash } from "../hydrus-config-store";
import { ServiceType } from "../models";

export const useGetServicesQuery = () => {
  const sessionKeyHash = useSessionKeyHash();

  return useQuery({
    queryKey: ["getServices", sessionKeyHash],
    queryFn: async () => {
      return getServices();
    },
    enabled: !!sessionKeyHash,
    staleTime: Infinity, // Services don't change often
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
