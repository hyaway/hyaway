import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(galleries)/remote-history")({
  component: () => <Outlet />,
  beforeLoad: () => ({
    getTitle: () => "Remote watch history",
  }),
});
