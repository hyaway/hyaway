import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { IconAlertCircle } from "@tabler/icons-react";

import { ContentDetailsTable } from "./-components/content-details-table";
import { FileDetailSkeleton } from "./-components/file-detail-skeleton";
import { FileInfoTable } from "./-components/file-info-table";
import { FilePageHeader } from "./-components/file-page-header";
import { FileStatusBadges } from "./-components/file-status-badges";
import { FileViewer } from "./-components/file-viewer";
import { Alert, AlertTitle } from "@/components/ui-primitives/alert";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingBar } from "@/components/page-shell/page-floating-bar";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";
import { useFileActions } from "@/hooks/use-file-actions";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useHistoryActions } from "@/lib/history-store";
import { InlineTagsList } from "@/components/tag/inline-tags-list";
import { FileViewerSettingsPopover } from "@/routes/(settings)/-components/file-viewer-settings-popover";

export const Route = createFileRoute("/_auth/(file)/file/$fileId")({
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
          <IconAlertCircle />
          <AlertTitle>File not found</AlertTitle>
        </Alert>
      </>
    );
  }

  return <FileDetailContent data={data} fileId={fileIdNum} />;
}

function FileDetailContent({
  data,
  fileId,
}: {
  data: NonNullable<ReturnType<typeof useGetSingleFileMetadata>["data"]>;
  fileId: number;
}) {
  const { addViewedFile } = useHistoryActions();

  // Track file view when component mounts with valid data
  useEffect(() => {
    addViewedFile(fileId);
  }, [fileId, addViewedFile]);

  const actionGroups = useFileActions(data, {
    includeExternal: true,
    includeThumbnail: false,
  });
  const allActions = actionGroups.flatMap((g) => g.actions);

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pb-12 sm:gap-2 sm:pb-16">
        <FileViewer data={data} />
        <FilePageHeader fileId={fileId} />
        <Separator />
        <div className="flex items-center justify-between gap-2">
          <FileStatusBadges data={data} />
        </div>
        <Separator className={"mb-4"} />

        <div className="@container space-y-4">
          <Heading level={2}>File metadata</Heading>
          <div className="grid gap-4 @lg:grid-cols-2">
            <ContentDetailsTable data={data} />
            <FileInfoTable data={data} />
          </div>
        </div>
        <Separator className={"mt-2 mb-4"} />
        <InlineTagsList data={data} />
      </div>

      <PageFloatingBar
        actions={allActions}
        rightContent={<FileViewerSettingsPopover />}
      />
    </>
  );
}
