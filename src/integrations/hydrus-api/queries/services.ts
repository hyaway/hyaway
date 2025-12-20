import { useQuery } from "@tanstack/react-query";
import { useHydrusApiClient } from "../hydrus-config-store";
import { ServiceType } from "../models";

export const useGetServicesQuery = () => {
  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["getServices", hydrusApi, hydrusApi?.toJSON()],
    queryFn: async () => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      return hydrusApi.getServices();
    },
    enabled: !!hydrusApi,
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
