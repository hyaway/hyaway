import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(galleries)/longest-viewed")({
  component: () => <Outlet />,
  beforeLoad: () => ({
    getTitle: () => "Longest viewed",
  }),
});
