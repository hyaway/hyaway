import { Permission } from "./models";
import type { VerifyAccessKeyResponse } from "./models";

/**
 * Permissions required for the app to function properly.
 */
export const REQUIRED_PERMISSIONS = [
  Permission.IMPORT_AND_DELETE_FILES,
  Permission.SEARCH_FOR_AND_FETCH_FILES,
  Permission.MANAGE_PAGES,
  Permission.MANAGE_DATABASE,
  Permission.EDIT_FILE_TIMES,
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
 * Check if the access key has all required permissions.
 */
export function checkPermissions(
  permissionsData?: VerifyAccessKeyResponse,
): boolean {
  if (!permissionsData) return false;
  if (permissionsData.permits_everything) return true;
  return REQUIRED_PERMISSIONS.every((p) =>
    permissionsData.basic_permissions.includes(p),
  );
}

/**
 * Get list of missing permissions from the access key response.
 */
export function getMissingPermissions(
  data?: VerifyAccessKeyResponse,
): Array<Permission> {
  if (!data || data.permits_everything) return [];
  return REQUIRED_PERMISSIONS.filter(
    (p) => !data.basic_permissions.includes(p),
  );
}
