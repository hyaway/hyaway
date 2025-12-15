import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Login } from "../components/settings/login";
import { useIsAuthenticated } from "../integrations/hydrus-api/queries/access";

export const Route = createFileRoute("/_auth")({
  component: AuthPageLayout,
});

function AuthPageLayout() {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Outlet />;
}
