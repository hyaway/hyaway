import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Login } from "../components/settings/login";
import { useIsAuthenticated } from "../integrations/hydrus-api/queries/access";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="p-4">
      <Outlet />
    </div>
  );
}
