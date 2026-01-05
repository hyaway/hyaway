import { createFileRoute } from "@tanstack/react-router";

import { FileDetail } from "@/components/file-detail/file-detail";
import { PagePermissionGate } from "@/components/page-shell/page-permission-gate";
import { Permission } from "@/integrations/hydrus-api/models";

export const Route = createFileRoute("/_auth/file/$fileId")({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `File ${params.fileId}`,
  }),
});

const PAGE_TITLE = "File detail";
const PAGE_PERMISSIONS = [Permission.SEARCH_FOR_AND_FETCH_FILES];

function RouteComponent() {
  const { fileId } = Route.useParams();
  const fileIdNum = Number(fileId);

  return (
    <PagePermissionGate
      title={PAGE_TITLE}
      requiredPermissions={PAGE_PERMISSIONS}
    >
      <FileDetail fileId={fileIdNum} />
    </PagePermissionGate>
  );
}
