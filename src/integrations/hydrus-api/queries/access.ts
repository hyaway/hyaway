import { useMutation, useQuery } from "@tanstack/react-query";
import { HydrusApiClient } from "../api-client";
import { useHydrusApiClient } from "../hydrus-config-store";
import { Permission } from "../models";
import type { AccessKeyType, VerifyAccessKeyResponse } from "../models";

export const useApiVersionQuery = (apiEndpoint: string) => {
  return useQuery({
    queryKey: ["apiVersion", apiEndpoint],
    queryFn: async () => {
      return HydrusApiClient.getApiVersion(apiEndpoint);
    },
    enabled: !!apiEndpoint,
    retry: false,
  });
};

export const useRequestNewPermissionsMutation = () => {
  return useMutation({
    mutationFn: async ({
      apiEndpoint,
      name,
    }: {
      apiEndpoint: string;
      name: string;
    }) => {
      return HydrusApiClient.requestNewPermissions(apiEndpoint, name);
    },
    mutationKey: ["requestNewPermissions"],
  });
};

const requiredPermissions = [
  Permission.IMPORT_AND_DELETE_FILES,
  Permission.EDIT_FILE_TAGS,
  Permission.SEARCH_FOR_AND_FETCH_FILES,
  Permission.MANAGE_PAGES,
] as const;

function checkPermissions(permissionsData?: VerifyAccessKeyResponse) {
  const hasRequiredPermissions =
    !!permissionsData?.permits_everything ||
    requiredPermissions.every((p) =>
      permissionsData?.basic_permissions.includes(p),
    );
  return hasRequiredPermissions;
}

export const useVerifyAccessQuery = (keyType: AccessKeyType) => {
  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["verifyAccess", keyType, hydrusApi],
    queryFn: async () => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      return hydrusApi.verifyAccessKey(keyType);
    },
    // compute whether the API key has required permissions inside the query
    select: (data: VerifyAccessKeyResponse) => {
      return {
        raw: data,
        hasRequiredPermissions: checkPermissions(data),
      };
    },
    enabled: !!hydrusApi,
    // Persistent key rarely changes; keep effectively permanent.
    // Session key lasts up to a day or until remote client restarts. Use a generous stale time & focus/refetch triggers
    // instead of frequent polling. If the client restarts and a 419/403 occurs, interceptor + error state will surface it.
    staleTime: keyType === "persistent" ? Infinity : 6 * 60 * 60 * 1000, // 6h; adjust upward if needed
    refetchInterval: false,
    retry: false,
  });
};

export const useIsAuthenticated = (): boolean => {
  const { data } = useVerifyAccessQuery("session");
  return !!data && data.hasRequiredPermissions;
};

/**
 * Imperative (mutation-based) variant of access verification.
 * Useful for on-demand checks without subscribing a component to query re-renders.
 * Returns mutation object whose data includes permission analysis.
 */
export const useVerifyAccessMutation = () => {
  const hydrusApi = useHydrusApiClient();
  return useMutation({
    mutationFn: async (keyType: AccessKeyType) => {
      if (!hydrusApi) throw new Error("Hydrus API client is required.");
      const response = await hydrusApi.verifyAccessKey(keyType);
      return {
        raw: response,
        hasRequiredPermissions: checkPermissions(response),
      };
    },
    mutationKey: ["verifyAccess"],
  });
};
