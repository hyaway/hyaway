import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PagePermissionGate } from "@/components/page-shell/page-permission-gate";
import { Permission } from "@/integrations/hydrus-api/models";

export const Route = createFileRoute("/_auth/(review)/review")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Review queue",
  }),
});

const PAGE_TITLE = "Review queue";
const PAGE_PERMISSIONS = [
  Permission.SEARCH_FOR_AND_FETCH_FILES,
  Permission.IMPORT_AND_DELETE_FILES,
];

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
