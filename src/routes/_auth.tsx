import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Login } from "../components/settings/login";
import { useIsAuthenticated } from "../integrations/hydrus-api/queries/access";
import { AuthLayout } from "@/components/ui-primitives/auth-layout";

export const Route = createFileRoute("/_auth")({
  component: AuthPageLayout,
});

function AuthPageLayout() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <AuthLayout>
      <Login />
    </AuthLayout>
  );

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Outlet />;
}
