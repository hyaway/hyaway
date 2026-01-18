// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Permission } from "./models";
import type { VerifyAccessKeyResponse } from "./models";

/**
 * Minimum permission required for the app to function at all.
 * Only search/fetch is absolutely required - other features degrade gracefully.
 */
export const MINIMUM_REQUIRED_PERMISSIONS =
  Permission.SEARCH_FOR_AND_FETCH_FILES;

/**
 * Permissions that enhance app functionality (not required but recommended).
 * - IMPORT_AND_DELETE_FILES: Archive/trash file management
 * - MANAGE_PAGES: View/manage Hydrus pages
 * - MANAGE_DATABASE: Access thumbnail dimensions, namespace colors
 * - EDIT_FILE_TIMES: Sync view statistics to Hydrus
 */
export const OPTIONAL_PERMISSIONS = [
  Permission.IMPORT_AND_DELETE_FILES,
  Permission.MANAGE_PAGES,
  Permission.MANAGE_DATABASE,
  Permission.EDIT_FILE_TIMES,
] as const;

export const ALL_PERMISSIONS = [
  MINIMUM_REQUIRED_PERMISSIONS,
  ...OPTIONAL_PERMISSIONS,
] as const;

/**
 * Human-readable labels for each permission.
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.IMPORT_AND_EDIT_URLS]: "Import and edit URLs",
  [Permission.IMPORT_AND_DELETE_FILES]: "Import and delete files",
  [Permission.EDIT_FILE_TAGS]: "Edit file tags",
  [Permission.SEARCH_FOR_AND_FETCH_FILES]: "Search for and fetch files",
  [Permission.MANAGE_PAGES]: "Manage pages",
  [Permission.MANAGE_COOKIES_AND_HEADERS]: "Manage cookies and headers",
  [Permission.MANAGE_DATABASE]: "Manage database",
  [Permission.EDIT_FILE_NOTES]: "Edit file notes",
  [Permission.EDIT_FILE_RELATIONSHIPS]: "Edit file relationships",
  [Permission.EDIT_FILE_RATINGS]: "Edit file ratings",
  [Permission.MANAGE_POPUPS]: "Manage popups",
  [Permission.EDIT_FILE_TIMES]: "Edit file times",
  [Permission.COMMIT_PENDING]: "Commit pending",
  [Permission.SEE_LOCAL_PATHS]: "See local paths",
};

/**
 * Check if the access key has the minimum required permission (search/fetch).
 * The app can work with reduced functionality if other permissions are missing.
 */
export function checkMinimumPermissions(
  permissionsData?: VerifyAccessKeyResponse,
): boolean {
  if (!permissionsData) return false;
  if (permissionsData.permits_everything) return true;
  return permissionsData.basic_permissions.includes(
    MINIMUM_REQUIRED_PERMISSIONS,
  );
}

/**
 * @deprecated Use checkMinimumPermissions instead.
 * Check if the access key has the minimum required permission.
 */
export function checkPermissions(
  permissionsData?: VerifyAccessKeyResponse,
): boolean {
  return checkMinimumPermissions(permissionsData);
}

/**
 * Get list of optional permissions that are missing from the access key response.
 * These enhance functionality but aren't required.
 */
export function getMissingOptionalPermissions(
  data?: VerifyAccessKeyResponse,
): Array<Permission> {
  if (!data || data.permits_everything) return [];
  return OPTIONAL_PERMISSIONS.filter(
    (p) => !data.basic_permissions.includes(p),
  );
}

/**
 * Get list of missing permissions from the access key response.
 * Only returns the minimum required permission if missing.
 */
export function getMissingPermissions(
  data?: VerifyAccessKeyResponse,
): Array<Permission> {
  if (!data) return [MINIMUM_REQUIRED_PERMISSIONS];
  if (data.permits_everything) return [];
  if (!data.basic_permissions.includes(MINIMUM_REQUIRED_PERMISSIONS)) {
    return [MINIMUM_REQUIRED_PERMISSIONS];
  }
  return [];
}
