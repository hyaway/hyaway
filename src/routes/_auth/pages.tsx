import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/pages")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
