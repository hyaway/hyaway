// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getApiVersion,
  requestNewPermissions,
  verifyAccessKey,
} from "../api-client";
import {
  useApiEndpoint,
  useAuthWithSessionKey,
  useIsApiConfigured,
} from "../hydrus-config-store";
import { ALL_PERMISSIONS, checkMinimumPermissions } from "../permissions";
import type {
  AccessKeyType,
  Permission,
  VerifyAccessKeyResponse,
} from "../models";

export const useApiVersionQuery = () => {
  const apiEndpoint = useApiEndpoint();
  return useQuery({
    queryKey: ["apiVersion"],
    queryFn: async ({ signal }) => {
      return getApiVersion(signal);
    },
    enabled: !!apiEndpoint,
    retry: false,
  });
};

export const useRequestNewPermissionsMutation = () => {
  return useMutation({
    mutationFn: async ({
      name,
      permitsEverything,
    }: {
      name: string;
      permitsEverything: boolean;
    }) => {
      return requestNewPermissions(name, permitsEverything, ALL_PERMISSIONS);
    },
    mutationKey: ["requestNewPermissions"],
  });
};

/**
 * Verify persistent access key validity.
 */
export const useVerifyPersistentAccessQuery = () => {
  const isConfigured = useIsApiConfigured();
  const validEndpoint = useApiVersionQuery();

  return useQuery({
    queryKey: ["verifyAccess", "persistent"],
    queryFn: async ({ signal }) => {
      return verifyAccessKey("persistent", signal);
    },
    select: (data: VerifyAccessKeyResponse) => ({
      raw: data,
      hasRequiredPermissions: checkMinimumPermissions(data),
    }),
    enabled: isConfigured && validEndpoint.isSuccess,
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
  const authWithSessionKey = useAuthWithSessionKey();

  return useQuery({
    queryKey: ["verifyAccess", "session"],
    queryFn: async ({ signal }) => {
      // verifyAccessKey("session") calls ensureSessionKey() internally,
      // which will fetch a session key if one doesn't exist
      return verifyAccessKey("session", signal);
    },
    select: (data: VerifyAccessKeyResponse) => ({
      raw: data,
      hasRequiredPermissions: checkMinimumPermissions(data),
    }),
    // Only run when session key auth is enabled
    enabled: isConfigured && validEndpoint.isSuccess && authWithSessionKey,
    // Session key lasts up to a day or until remote client restarts.
    // Use a generous stale time & focus/refetch triggers instead of frequent polling.
    // If the client restarts and a 419/403 occurs, interceptor + error state will surface it.
    staleTime: 6 * 60 * 60 * 1000, // 6h
    refetchInterval: false,
    retry: false,
  });
};

export const useIsAuthenticated = (): boolean => {
  const authWithSessionKey = useAuthWithSessionKey();
  const { data: persistentData } = useVerifyPersistentAccessQuery();
  const { data: sessionData } = useVerifySessionAccessQuery();

  // When session keys are disabled, only check persistent key
  if (!authWithSessionKey) {
    return !!persistentData?.hasRequiredPermissions;
  }

  return (
    !!persistentData?.hasRequiredPermissions &&
    !!sessionData?.hasRequiredPermissions
  );
};

/**
 * Check if the current access key has a specific permission.
 * Returns true if permits_everything or if the permission is in basic_permissions.
 */
export const useHasPermission = (permission: Permission): boolean => {
  const { data } = useVerifyPersistentAccessQuery();
  if (!data?.raw) return false;
  if (data.raw.permits_everything) return true;
  return data.raw.basic_permissions.includes(permission);
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
        hasRequiredPermissions: checkMinimumPermissions(response),
      };
    },
    mutationKey: ["verifyAccess"],
  });
};
