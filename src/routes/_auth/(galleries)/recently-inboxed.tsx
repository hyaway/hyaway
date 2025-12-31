import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(galleries)/recently-inboxed")({
  component: () => <Outlet />,
  beforeLoad: () => ({
    getTitle: () => "Recently inboxed",
  }),
});
