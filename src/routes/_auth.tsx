import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
} from "@heroicons/react/16/solid";
import {
  useVerifyPersistentAccessQuery,
  useVerifySessionAccessQuery,
} from "@/integrations/hydrus-api/queries/access";
import { Button, LinkButton } from "@/components/ui-primitives/button";
import { Spinner } from "@/components/ui-primitives/spinner";

export const Route = createFileRoute("/_auth")({
  component: AuthPageLayout,
});

function AuthPageLayout() {
  const persistentQuery = useVerifyPersistentAccessQuery();
  const sessionQuery = useVerifySessionAccessQuery();

  const isLoading = persistentQuery.isLoading || sessionQuery.isLoading;
  const isPending =
    persistentQuery.isPending ||
    sessionQuery.isPending ||
    (persistentQuery.isFetching && !persistentQuery.data) ||
    (sessionQuery.isFetching && !sessionQuery.data);
  const hasError = persistentQuery.isError || sessionQuery.isError;
  const isAuthenticated =
    persistentQuery.data?.hasRequiredPermissions &&
    sessionQuery.data?.hasRequiredPermissions;

  // Show loading state with delayed fade-in to prevent flash
  if (isLoading || isPending) {
    return <AuthLoadingScreen />;
  }

  // Show error state
  if (hasError) {
    return (
      <AuthErrorScreen
        error={persistentQuery.error || sessionQuery.error}
        onRetry={() => {
          persistentQuery.refetch();
          sessionQuery.refetch();
        }}
      />
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return <AuthLoginPrompt />;
  }

  return <Outlet />;
}

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner className="text-muted-foreground size-8" />
        <div className="flex flex-col gap-1">
          <p className="text-foreground text-sm font-medium">
            Verifying access...
          </p>
          <p className="text-muted-foreground text-xs">
            Checking permissions with Hydrus
          </p>
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
          <ExclamationTriangleIcon className="text-destructive size-8" />
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
            <ArrowPathIcon data-icon="inline-start" />
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
          <LockClosedIcon className="text-muted-foreground size-8" />
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
          <LockClosedIcon data-icon="inline-start" />
          Configure connection
        </LinkButton>
        <p className="text-muted-foreground text-xs">
          Need help?{" "}
          <Link
            to="/settings/client-api"
            className="text-primary hover:text-primary/80 underline underline-offset-2"
          >
            View setup instructions
          </Link>
        </p>
      </div>
    </div>
  );
}
