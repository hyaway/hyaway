// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(remote-pages)/pages/$pageId")({
  component: () => <Outlet />,
  beforeLoad: ({ params }) => ({
    getTitle: () => params.pageId,
  }),
});
