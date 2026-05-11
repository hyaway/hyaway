// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Outlet, createFileRoute } from "@tanstack/react-router";
import { getSearchDisplayName } from "@/stores/search-queries-store";

export const Route = createFileRoute("/_auth/(search)/search/$searchId")({
  component: () => <Outlet />,
  beforeLoad: ({ params }) => ({
    getTitle: () => getSearchDisplayName(params.searchId),
  }),
});
