import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { IconAlertTriangle, IconLock, IconRefresh } from "@tabler/icons-react";
import {
  useApiVersionQuery,
  useVerifyPersistentAccessQuery,
  useVerifySessionAccessQuery,
} from "@/integrations/hydrus-api/queries/access";
import { useIsApiConfigured } from "@/integrations/hydrus-api/hydrus-config-store";
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

  // Not configured - show login prompt immediately
  if (!isConfigured) {
    return <AuthLoginPrompt />;
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

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return <AuthLoginPrompt />;
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
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="bg-destructive/10 flex size-16 items-center justify-center rounded-full">
          <IconAlertTriangle className="text-destructive size-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-lg font-medium">
            Connection failed
          </h2>
          <p className="text-muted-foreground text-sm text-balance">
            {error?.message || "Could not verify access to the Hydrus client."}
          </p>
        </div>
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
      </div>
    </div>
  );
}

function AuthLoginPrompt() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="bg-muted flex size-16 items-center justify-center rounded-full">
          <IconLock className="text-muted-foreground size-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-lg font-medium">
            Authentication required
          </h2>
          <p className="text-muted-foreground text-sm text-balance">
            Connect to your Hydrus client to access this page. You'll need to
            configure the API endpoint and access key.
          </p>
        </div>
        <LinkButton to="/settings/client-api" size="lg">
          <IconLock data-icon="inline-start" />
          Configure connection
        </LinkButton>
      </div>
    </div>
  );
}
