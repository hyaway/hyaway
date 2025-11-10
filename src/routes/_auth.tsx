import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Settings } from "../components/settings";
import { useApiAccessKey, useApiEndpoint } from "../hooks/useAuth";
import { useVerifyAccessQuery } from "../integrations/hydrus-api/queries";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { hasRequiredPermissions, isLoading } = useVerifyAccessQuery();
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  const hasCredentials = !!(apiEndpoint && apiAccessKey);

  if (isLoading && hasCredentials) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!hasRequiredPermissions) {
    return <Settings />;
  }

  return <Outlet />;
}
