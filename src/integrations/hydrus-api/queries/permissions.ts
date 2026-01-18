// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo } from "react";
import { useVerifyPersistentAccessQuery } from "./access";
import type { Permission } from "../models";

/**
 * Hook to check permissions.
 */
export function usePermissions(): {
  /** Check if a specific permission is granted */
  hasPermission: (permission: Permission) => boolean;
  /** Whether permissions have been fetched */
  isFetched: boolean;
  /** Whether permissions are currently being fetched */
  isPending: boolean;
} {
  const { data, isFetched, isPending } = useVerifyPersistentAccessQuery();
  const raw = data?.raw;

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!raw) return false;
      if (raw.permits_everything) return true;
      return raw.basic_permissions.includes(permission);
    },
    [raw],
  );

  return useMemo(
    () => ({ hasPermission, isFetched, isPending }),
    [hasPermission, isFetched, isPending],
  );
}
