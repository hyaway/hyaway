import { Outlet, createFileRoute } from "@tanstack/react-router";
import {
  IconAlertTriangle,
  IconLock,
  IconRefresh,
  IconShieldOff,
} from "@tabler/icons-react";

import type { Permission } from "@/integrations/hydrus-api/models";
import { useIsApiConfigured } from "@/integrations/hydrus-api/hydrus-config-store";
import { getMissingPermissions } from "@/integrations/hydrus-api/permissions";
import {
  useApiVersionQuery,
  useVerifyPersistentAccessQuery,
  useVerifySessionAccessQuery,
} from "@/integrations/hydrus-api/queries/access";
import { AuthStatusScreen } from "@/components/page-shell/auth-status-screen";
import { MissingPermissionsList } from "@/components/page-shell/missing-permissions-list";
import { Button, LinkButton } from "@/components/ui-primitives/button";
import { Spinner } from "@/components/ui-primitives/spinner";

export const Route = createFileRoute("/_auth")({
  component: AuthPageLayout,
});

function AuthPageLayout() {
  const isConfigured = useIsApiConfigured();
  const versionQuery = useApiVersionQuery();
  const persistentQuery = useVerifyPersistentAccessQuery();
  const sessionQuery = useVerifySessionAccessQuery();

  // Not configured - show setup prompt immediately
  if (!isConfigured) {
    return <AuthNotConfiguredPrompt />;
  }

  const isPending =
    versionQuery.isPending ||
    persistentQuery.isPending ||
    sessionQuery.isPending;
  const hasError =
    versionQuery.isError || persistentQuery.isError || sessionQuery.isError;
  const hasData =
    versionQuery.data && persistentQuery.data && sessionQuery.data;
  const isAuthenticated =
    persistentQuery.data?.hasRequiredPermissions &&
    sessionQuery.data?.hasRequiredPermissions;

  // Show error state first - but only if we don't have cached data
  if (hasError && !hasData) {
    return (
      <AuthErrorScreen
        error={
          versionQuery.error || persistentQuery.error || sessionQuery.error
        }
        onRetry={() => {
          versionQuery.refetch();
          persistentQuery.refetch();
          sessionQuery.refetch();
        }}
      />
    );
  }

  // Show loading state while waiting for data
  if (isPending) {
    return (
      <AuthLoadingScreen
        versionPending={versionQuery.isPending}
        persistentPending={persistentQuery.isPending}
        sessionPending={sessionQuery.isPending}
      />
    );
  }

  // Show missing permissions prompt if configured but lacking permissions
  if (!isAuthenticated) {
    const missingPermissions = getMissingPermissions(persistentQuery.data.raw);
    return (
      <AuthMissingPermissionsPrompt missingPermissions={missingPermissions} />
    );
  }

  return <Outlet />;
}

function AuthLoadingScreen({
  versionPending,
  persistentPending,
  sessionPending,
}: {
  versionPending: boolean;
  persistentPending: boolean;
  sessionPending: boolean;
}) {
  const status = versionPending
    ? "Verifying Hydrus endpoint..."
    : persistentPending
      ? "Verifying access key..."
      : sessionPending
        ? "Establishing session..."
        : "Checking permissions with Hydrus";

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner className="text-muted-foreground size-8" />
        <div className="flex flex-col gap-1">
          <p className="text-foreground text-sm font-medium">
            Verifying access...
          </p>
          <p className="text-muted-foreground text-xs">{status}</p>
        </div>
      </div>
    </div>
  );
}

function AuthErrorScreen({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <AuthStatusScreen
      icon={<IconAlertTriangle className="text-destructive size-8" />}
      variant="destructive"
      title="Connection failed"
      description={
        error?.message || "Could not verify access to the Hydrus client."
      }
      actions={
        <div className="flex w-full gap-2">
          <Button variant="outline" onClick={onRetry} className="flex-1">
            <IconRefresh data-icon="inline-start" />
            Retry
          </Button>
          <LinkButton
            to="/settings/client-api"
            variant="default"
            className="flex-1"
          >
            Configure API
          </LinkButton>
        </div>
      }
    />
  );
}

function AuthNotConfiguredPrompt() {
  return (
    <AuthStatusScreen
      icon={<IconLock className="text-muted-foreground size-8" />}
      variant="default"
      title="Connect to Hydrus"
      description="Configure the API endpoint and access key to connect to your Hydrus client."
      actions={
        <LinkButton to="/settings/client-api" size="lg">
          <IconLock data-icon="inline-start" />
          Configure connection
        </LinkButton>
      }
    />
  );
}

function AuthMissingPermissionsPrompt({
  missingPermissions,
}: {
  missingPermissions: Array<Permission>;
}) {
  return (
    <AuthStatusScreen
      icon={<IconShieldOff className="text-warning size-8" />}
      variant="warning"
      title="Missing permissions"
      description="Your access key is missing required permissions. Update your API key in Hydrus to include these permissions (or permit everything):"
      actions={
        <LinkButton to="/settings/client-api" size="lg">
          Update API settings
        </LinkButton>
      }
    >
      <MissingPermissionsList missingPermissions={missingPermissions} />
    </AuthStatusScreen>
  );
}
