import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getApiVersion,
  requestNewPermissions,
  verifyAccessKey,
} from "../api-client";
import { useApiEndpoint, useIsApiConfigured } from "../hydrus-config-store";
import { Permission } from "../models";
import type { AccessKeyType, VerifyAccessKeyResponse } from "../models";

export const useApiVersionQuery = () => {
  const apiEndpoint = useApiEndpoint();
  return useQuery({
    queryKey: ["apiVersion"],
    queryFn: async () => {
      return getApiVersion();
    },
    enabled: !!apiEndpoint,
    retry: false,
  });
};

export const useRequestNewPermissionsMutation = () => {
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      return requestNewPermissions(name);
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

/**
 * Verify persistent access key validity.
 */
export const useVerifyPersistentAccessQuery = () => {
  const isConfigured = useIsApiConfigured();
  const validEndpoint = useApiVersionQuery();

  return useQuery({
    queryKey: ["verifyAccess", "persistent"],
    queryFn: async () => {
      return verifyAccessKey("persistent");
    },
    select: (data: VerifyAccessKeyResponse) => ({
      raw: data,
      hasRequiredPermissions: checkPermissions(data),
    }),
    enabled: isConfigured && validEndpoint.isSuccess,
    // Persistent key rarely changes; keep effectively permanent
    staleTime: Infinity,
    refetchInterval: false,
    retry: false,
  });
};

/**
 * Verify session key validity.
 * Will automatically acquire a session key if one doesn't exist.
 */
export const useVerifySessionAccessQuery = () => {
  const isConfigured = useIsApiConfigured();
  const validEndpoint = useApiVersionQuery();

  return useQuery({
    queryKey: ["verifyAccess", "session"],
    queryFn: async () => {
      // verifyAccessKey("session") calls ensureSessionKey() internally,
      // which will fetch a session key if one doesn't exist
      return verifyAccessKey("session");
    },
    select: (data: VerifyAccessKeyResponse) => ({
      raw: data,
      hasRequiredPermissions: checkPermissions(data),
    }),
    enabled: isConfigured && validEndpoint.isSuccess,
    // Session key lasts up to a day or until remote client restarts.
    // Use a generous stale time & focus/refetch triggers instead of frequent polling.
    // If the client restarts and a 419/403 occurs, interceptor + error state will surface it.
    staleTime: 6 * 60 * 60 * 1000, // 6h
    refetchInterval: false,
    retry: false,
  });
};

export const useIsAuthenticated = (): boolean => {
  const { data: persistentData } = useVerifyPersistentAccessQuery();
  const { data: sessionData } = useVerifySessionAccessQuery();
  return (
    !!persistentData?.hasRequiredPermissions &&
    !!sessionData?.hasRequiredPermissions
  );
};

/**
 * Imperative (mutation-based) variant of access verification.
 * Useful for on-demand checks without subscribing a component to query re-renders.
 * Returns mutation object whose data includes permission analysis.
 */
export const useVerifyAccessMutation = () => {
  const isConfigured = useIsApiConfigured();
  return useMutation({
    mutationFn: async (keyType: AccessKeyType) => {
      if (!isConfigured) throw new Error("Hydrus API is not configured.");
      const response = await verifyAccessKey(keyType);
      return {
        raw: response,
        hasRequiredPermissions: checkPermissions(response),
      };
    },
    mutationKey: ["verifyAccess"],
  });
};
