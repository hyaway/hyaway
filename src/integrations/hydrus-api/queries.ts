import { useQuery } from "@tanstack/react-query";
import { useApiAccessKey, useApiEndpoint } from "../../hooks/useAuth";
import { Permission, verifyAccessKey } from "./hydrus-api";

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
