import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useIsAuthenticated } from "@/integrations/hydrus-api/queries/access";
import { LinkButton } from "@/components/ui-primitives/button";

export const Route = createFileRoute("/_auth")({
  component: AuthPageLayout,
});

function AuthPageLayout() {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <LinkButton to="/settings/client-api">Login</LinkButton>;
  }

  return <Outlet />;
}
