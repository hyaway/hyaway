import { useQuery } from "@tanstack/react-query";
import { getServices } from "../api-client";
import { useAuthKeyHash } from "../hydrus-config-store";
import { ServiceType } from "../models";

export const useGetServicesQuery = () => {
  const authKeyHash = useAuthKeyHash();

  return useQuery({
    queryKey: ["getServices", authKeyHash],
    queryFn: async () => {
      return getServices();
    },
    enabled: !!authKeyHash,
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
