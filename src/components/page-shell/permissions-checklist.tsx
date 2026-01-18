// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconCheck, IconX } from "@tabler/icons-react";
import type {
  Permission,
  VerifyAccessKeyResponse,
} from "@/integrations/hydrus-api/models";
import {
  MINIMUM_REQUIRED_PERMISSIONS,
  OPTIONAL_PERMISSIONS,
  PERMISSION_LABELS,
} from "@/integrations/hydrus-api/permissions";

interface PermissionsChecklistBaseProps {
  /** Optional subset of permissions to display (defaults to all) */
  permissions?: Array<Permission>;
}

interface PermissionsChecklistWithDataProps extends PermissionsChecklistBaseProps {
  /** The raw verify access key response */
  permissionsData: VerifyAccessKeyResponse;
  hasPermission?: never;
}

interface PermissionsChecklistWithFunctionProps extends PermissionsChecklistBaseProps {
  /** Function to check if a permission is granted */
  hasPermission: (permission: Permission) => boolean;
  permissionsData?: never;
}

type PermissionsChecklistProps =
  | PermissionsChecklistWithDataProps
  | PermissionsChecklistWithFunctionProps;

/**
 * Displays a checklist of permissions with their status.
 * Shows checkmarks for granted permissions and X marks for missing ones.
 *
 * Can be used with either:
 * - `permissionsData` - raw verify access key response (shows all permissions)
 * - `hasPermission` + `permissions` - custom checker with subset of permissions
 */
export function PermissionsChecklist(props: PermissionsChecklistProps) {
  const checkPermission = (permission: Permission): boolean => {
    if (props.permissionsData) {
      if (props.permissionsData.permits_everything) return true;
      return props.permissionsData.basic_permissions.includes(permission);
    }
    return props.hasPermission(permission);
  };

  // When permissions subset is provided, all are considered required
  const isCustomSubset = !!props.permissions;
  const permissionsToShow =
    props.permissions ??
    ([
      MINIMUM_REQUIRED_PERMISSIONS,
      ...OPTIONAL_PERMISSIONS,
    ] as Array<Permission>);

  return (
    <div className="bg-muted w-full rounded-lg p-3 text-sm">
      <ul className="space-y-1">
        {permissionsToShow.map((permission) => {
          const granted = checkPermission(permission);
          // In custom subset mode, all are required; otherwise only MINIMUM_REQUIRED_PERMISSIONS
          const isRequired =
            isCustomSubset || permission === MINIMUM_REQUIRED_PERMISSIONS;

          return (
            <li key={permission} className="flex items-center gap-2">
              {granted ? (
                <IconCheck className="text-success size-4 shrink-0" />
              ) : (
                <IconX
                  className={`size-4 shrink-0 ${isRequired ? "text-destructive" : "text-warning"}`}
                />
              )}
              <span
                className={
                  granted ? "text-foreground" : "text-muted-foreground"
                }
              >
                {PERMISSION_LABELS[permission]}
                {!isCustomSubset &&
                  permission === MINIMUM_REQUIRED_PERMISSIONS && (
                    <span className="text-muted-foreground ml-1 text-xs">
                      (required)
                    </span>
                  )}
              </span>
            </li>
          );
        })}
      </ul>
      {props.permissionsData?.permits_everything && (
        <p className="text-muted-foreground mt-2 text-xs">
          This key permits everything
        </p>
      )}
    </div>
  );
}
