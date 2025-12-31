import { createFileRoute } from "@tanstack/react-router";

import { FileDetail } from "@/components/file-detail/file-detail";
import { FileViewerSettingsPopover } from "@/components/file-detail/file-viewer-settings-popover";

export const Route = createFileRoute("/_auth/file/$fileId")({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `File ${params.fileId}`,
  }),
});

function RouteComponent() {
  const { fileId } = Route.useParams();
  const fileIdNum = Number(fileId);

  return (
    <FileDetail
      fileId={fileIdNum}
      footerRightContent={<FileViewerSettingsPopover />}
    />
  );
}
