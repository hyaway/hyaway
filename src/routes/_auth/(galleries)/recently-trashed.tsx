import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(galleries)/recently-trashed")({
  component: () => <Outlet />,
  beforeLoad: () => ({
    getTitle: () => "Recently trashed",
  }),
});
