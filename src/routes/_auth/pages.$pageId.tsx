import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/pages/$pageId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_auth/pages/$pageId"!</div>;
}
