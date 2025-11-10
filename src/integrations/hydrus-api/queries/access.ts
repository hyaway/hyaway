import { useMutation, useQuery } from "@tanstack/react-query";
import { HydrusApiClient } from "../api-client";
import { useHydrusApiClient } from "../hydrus-config-store";
import { Permission } from "../models";
import type { AccessKeyType } from "../models";

export const usePermissionsQuery = (keyType: AccessKeyType) => {
  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["verifyAccess", keyType, hydrusApi],
    queryFn: async () => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      return hydrusApi.verifyAccessKey(keyType);
    },
    enabled: !!hydrusApi,
    select: (data) => {
      return {
        hasAllPermissions: data.permits_everything,
        permissions: data.basic_permissions,
      };
    },
    staleTime: Infinity,
  });
};

export const useVerifyAccessQuery = (keyType: AccessKeyType) => {
  const { data: permissionsData, ...rest } = usePermissionsQuery(keyType);

  const requiredPermissions = [
    Permission.IMPORT_AND_DELETE_FILES,
    Permission.EDIT_FILE_TAGS,
    Permission.SEARCH_FOR_AND_FETCH_FILES,
    Permission.MANAGE_PAGES,
  ];

  const hasRequiredPermissions =
    permissionsData?.hasAllPermissions ||
    requiredPermissions.every((p) => permissionsData?.permissions.includes(p));

  return {
    ...rest,
    hasRequiredPermissions,
  };
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
  });
};
