import { createFileRoute } from "@tanstack/react-router";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";

import { Alert, AlertTitle } from "@/components/ui-primitives/alert";
import { PageError } from "@/components/page/page-error";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { InlineTagsList } from "@/components/tag/inline-tags-list";
import { ContentDetailsTable } from "@/components/file-detail/content-details-table";
import { FileDetailSkeleton } from "@/components/file-detail/file-detail-skeleton";
import { FileInfoTable } from "@/components/file-detail/file-info-table";
import { FilePageHeader } from "@/components/file-detail/file-page-header";
import { FileStatusBadges } from "@/components/file-detail/file-status-badges";
import { FileViewer } from "@/components/file-detail/file-viewer";
import { FloatingActionBar } from "@/components/file-detail/floating-action-bar";
import { FileViewerSettingsPopover } from "@/components/settings/file-viewer-settings-popover";

export const Route = createFileRoute("/_auth/file/$fileId")({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `File ${params.fileId}`,
  }),
});

function RouteComponent() {
  const { fileId } = Route.useParams();
  const fileIdNum = Number(fileId);
  const { data, isLoading, isError, error } =
    useGetSingleFileMetadata(fileIdNum);

  if (isLoading) {
    return <FileDetailSkeleton fileId={fileIdNum} />;
  }

  if (isError) {
    return (
      <>
        <FilePageHeader fileId={fileIdNum} />
        <PageError
          error={error}
          fallbackMessage="An unknown error occurred while fetching file."
        />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <FilePageHeader fileId={fileIdNum} />
        <Alert variant="destructive">
          <ExclamationCircleIcon />
          <AlertTitle>File not found</AlertTitle>
        </Alert>
      </>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 pb-18">
      <FileViewer data={data} />

      <FilePageHeader fileId={fileIdNum} />
      <Separator />
      <div className="flex items-center justify-between gap-2">
        <FileStatusBadges data={data} />
        <FileViewerSettingsPopover />
      </div>
      <Separator />

      <div className="@container space-y-4">
        <Heading level={2}>File metadata</Heading>
        <div className="grid gap-4 @lg:grid-cols-2">
          <ContentDetailsTable data={data} />
          <FileInfoTable data={data} />
        </div>
      </div>
      <Separator />
      <InlineTagsList data={data} />

      <FloatingActionBar data={data} />
    </div>
  );
}
