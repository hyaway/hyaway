// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Outlet, createFileRoute } from "@tanstack/react-router";
import { IconAlertTriangle, IconLock, IconRefresh } from "@tabler/icons-react";

import { useIsApiConfigured } from "@/integrations/hydrus-api/hydrus-config-store";
import {
  useApiVersionQuery,
  useVerifyPersistentAccessQuery,
  useVerifySessionAccessQuery,
} from "@/integrations/hydrus-api/queries/access";
import { AuthStatusScreen } from "@/components/page-shell/auth-status-screen";
import { Button, LinkButton } from "@/components/ui-primitives/button";
import { Spinner } from "@/components/ui-primitives/spinner";

export const Route = createFileRoute("/_auth")({
  component: AuthPageLayout,
});

/**
 * Auth layout route - wraps all protected routes.
 * Handles connection/loading/error states centrally.
 * Individual pages handle their own permission checking via PagePermissionGate.
 */
function AuthPageLayout() {
  const isConfigured = useIsApiConfigured();
  const versionQuery = useApiVersionQuery();
  const persistentQuery = useVerifyPersistentAccessQuery();
  const sessionQuery = useVerifySessionAccessQuery();

  // Not configured - show setup prompt immediately
  if (!isConfigured) {
    return <AuthNotConfiguredPrompt />;
  }

  // Check if we have cached data (allows background refetches without showing loading)
  const hasData =
    versionQuery.data && persistentQuery.data && sessionQuery.data;

  // Only show loading on initial load, not background refetches
  const isInitialLoading =
    (versionQuery.isPending ||
      persistentQuery.isPending ||
      sessionQuery.isPending) &&
    !hasData;

  const hasError =
    versionQuery.isError || persistentQuery.isError || sessionQuery.isError;

  // Show error state - but only if we don't have cached data
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

  // Show loading state only on initial load (no cached data yet)
  if (isInitialLoading) {
    return (
      <AuthLoadingScreen
        versionPending={versionQuery.isPending}
        persistentPending={persistentQuery.isPending}
        sessionPending={sessionQuery.isPending}
      />
    );
  }

  // Permission checks are now handled per-page via PagePermissionGate
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
    <div className="animate-in fade-in fill-mode-backwards flex min-h-[50vh] items-center justify-center delay-500">
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
            to="/settings/connection"
            variant="default"
            className="flex-1"
          >
            Configure connection
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
        <div className="flex w-full flex-col items-center gap-3">
          <LinkButton to="/settings/connection" size="lg">
            <IconLock data-icon="inline-start" />
            Configure connection
          </LinkButton>
          <span>
            Need help?{" "}
            <a
              href="https://docs.hyaway.com/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Read the setup guide
            </a>
          </span>
        </div>
      }
    />
  );
}
