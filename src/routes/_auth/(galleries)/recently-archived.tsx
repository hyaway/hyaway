import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(galleries)/recently-archived")({
  component: () => <Outlet />,
  beforeLoad: () => ({
    getTitle: () => "Recently archived",
  }),
});
