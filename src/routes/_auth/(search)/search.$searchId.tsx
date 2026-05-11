// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(search)/search/$searchId")({
  component: () => <Outlet />,
  beforeLoad: ({ params }) => ({
    getTitle: () =>
      params.searchId === "scratch" ? "Search scratch" : `${params.searchId}`,
  }),
});
