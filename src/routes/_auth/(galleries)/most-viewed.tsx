import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(galleries)/most-viewed")({
  component: () => <Outlet />,
  beforeLoad: () => ({
    getTitle: () => "Most viewed",
  }),
});
