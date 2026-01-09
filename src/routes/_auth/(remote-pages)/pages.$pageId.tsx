import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(remote-pages)/pages/$pageId")({
  component: () => <Outlet />,
  beforeLoad: ({ params }) => ({
    getTitle: () => params.pageId,
  }),
});
