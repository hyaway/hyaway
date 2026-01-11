import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(settings)/settings/")({
  component: RouteComponent,
  beforeLoad: () => {
    throw redirect({ to: "/settings/connection" });
  },
});

function RouteComponent() {
  return null;
}
