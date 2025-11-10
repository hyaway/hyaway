import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useApiAccessKey,
  useApiEndpoint,
} from "../../integrations/hydrus-api/hydrus-config-store";
import {
  Permission,
  requestNewPermissions,
  verifyAccessKey,
} from "./hydrus-api";

export const usePermissionsQuery = () => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: ["verifyAccess", apiEndpoint, apiAccessKey],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey) {
        throw new Error("API endpoint and access key are required.");
      }
      return verifyAccessKey(apiEndpoint, apiAccessKey);
    },
    enabled: !!apiEndpoint && !!apiAccessKey,
    select: (data) => {
      return {
        hasAllPermissions: data.permits_everything,
        permissions: data.basic_permissions ?? [],
      };
    },
    staleTime: Infinity,
  });
};

export const useVerifyAccessQuery = () => {
  const { data: permissionsData, ...rest } = usePermissionsQuery();

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

export const useRequestNewPermissionsQuery = () => {
  return useMutation({
    mutationFn: async ({
      apiEndpoint,
      name,
    }: {
      apiEndpoint: string;
      name: string;
    }) => {
      return requestNewPermissions(apiEndpoint, name);
    },
  });
};
