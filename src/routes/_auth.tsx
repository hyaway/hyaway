import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Login } from "../components/settings/login";
import { useHydrusApiClient } from "../integrations/hydrus-api/hydrus-config-store";
import { useVerifyAccessQuery } from "../integrations/hydrus-api/queries/access";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { hasRequiredPermissions, isLoading } = useVerifyAccessQuery("session");
  const hydrusApi = useHydrusApiClient();

  if (isLoading && hydrusApi) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!hasRequiredPermissions) {
    return <Login />;
  }

  return (
    <div className="p-4">
      <Outlet />
    </div>
  );
}
