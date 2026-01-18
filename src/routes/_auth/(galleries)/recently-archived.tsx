// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PagePermissionGate } from "@/components/page-shell/page-permission-gate";
import { Permission } from "@/integrations/hydrus-api/models";

export const Route = createFileRoute("/_auth/(galleries)/recently-archived")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Recently archived",
  }),
});

const PAGE_TITLE = "Recently archived";
const PAGE_PERMISSIONS = [Permission.SEARCH_FOR_AND_FETCH_FILES];

function RouteComponent() {
  return (
    <PagePermissionGate
      title={PAGE_TITLE}
      requiredPermissions={PAGE_PERMISSIONS}
    >
      <Outlet />
    </PagePermissionGate>
  );
}
