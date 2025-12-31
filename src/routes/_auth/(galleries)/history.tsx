import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(galleries)/history")({
  component: () => <Outlet />,
  beforeLoad: () => ({
    getTitle: () => "Watch history",
  }),
});
