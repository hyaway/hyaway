import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
  beforeLoad: () => {
    throw redirect({ to: "/settings/client-api" });
  },
});

function RouteComponent() {
  return null;
}
