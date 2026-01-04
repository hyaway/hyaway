import type { Permission } from "@/integrations/hydrus-api/models";
import { PERMISSION_LABELS } from "@/integrations/hydrus-api/permissions";

interface MissingPermissionsListProps {
  missingPermissions: Array<Permission>;
  /** Visual variant for the indicator dot */
  variant?: "warning" | "destructive";
}

/**
 * Displays a list of missing permissions with indicator dots.
 * Used in auth screens and settings pages.
 */
export function MissingPermissionsList({
  missingPermissions,
  variant = "warning",
}: MissingPermissionsListProps) {
  if (missingPermissions.length === 0) return null;

  const dotColorClass =
    variant === "destructive" ? "bg-destructive" : "bg-warning";

  return (
    <ul className="bg-muted text-muted-foreground w-full rounded-lg p-3 text-left text-sm">
      {missingPermissions.map((permission) => (
        <li key={permission} className="flex items-center gap-2 py-1">
          <span className={`size-1.5 rounded-full ${dotColorClass}`} />
          {PERMISSION_LABELS[permission]}
        </li>
      ))}
    </ul>
  );
}
