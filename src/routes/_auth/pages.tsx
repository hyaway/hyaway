import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/pages")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Pages",
  }),
});

function RouteComponent() {
  return <Outlet />;
}
