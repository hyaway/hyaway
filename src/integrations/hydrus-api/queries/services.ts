import { useQuery } from "@tanstack/react-query";
import { useHydrusApiClient } from "../hydrus-config-store";

export const useGetServicesQuery = () => {
  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["getServices", hydrusApi],
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
