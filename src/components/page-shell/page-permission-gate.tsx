// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconShieldOff } from "@tabler/icons-react";
import type { ReactNode } from "react";
import type { Permission } from "@/integrations/hydrus-api/models";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { AuthStatusScreen } from "@/components/page-shell/auth-status-screen";
import { PermissionsChecklist } from "@/components/page-shell/permissions-checklist";
import { PageLoading } from "@/components/page-shell/page-loading";
import { LinkButton } from "@/components/ui-primitives/button";

interface PagePermissionGateProps {
  /** Page title shown in heading and loading state */
  title: string;
  /** Permissions required to access this page */
  requiredPermissions: Array<Permission>;
  /** Content to render when permissions are granted */
  children: ReactNode;
}

/**
 * Gate component that checks permissions before rendering page content.
 * Shows loading state while permissions are being fetched.
 * Shows friendly error message when required permissions are missing.
 *
 * Note: "Not configured" and connection error states are handled by the
 * parent _auth layout route, so this component only handles permission checks.
 */
export function PagePermissionGate({
  title,
  requiredPermissions,
  children,
}: PagePermissionGateProps) {
  const { hasPermission, isFetched, isPending } = usePermissions();

  // Show loading while permissions are being fetched
  if (isPending || !isFetched) {
    return <PageLoading title={title} />;
  }

  // Check which permissions are missing
  const missingPermissions = requiredPermissions.filter(
    (p) => !hasPermission(p),
  );

  // If any required permissions are missing, show error
  if (missingPermissions.length > 0) {
    return (
      <AuthStatusScreen
        icon={<IconShieldOff className="text-warning size-8" />}
        variant="warning"
        title="Missing permissions"
        description="Your access key is missing required permissions for this page. Update your API key in Hydrus to include these permissions (or permit everything):"
        actions={
          <LinkButton to="/settings/connection" size="lg">
            Update API settings
          </LinkButton>
        }
      >
        <PermissionsChecklist
          hasPermission={hasPermission}
          permissions={requiredPermissions}
        />
      </AuthStatusScreen>
    );
  }

  // All permissions granted, render content
  return <>{children}</>;
}
