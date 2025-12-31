import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(galleries)/random-inbox")({
  component: () => <Outlet />,
  beforeLoad: () => ({
    getTitle: () => "Random inbox",
  }),
});
