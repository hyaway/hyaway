import { createFileRoute } from "@tanstack/react-router";
import {
  ArchiveBoxIcon,
  ExclamationCircleIcon,
  InboxIcon,
  NoSymbolIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";

import { Alert, AlertTitle } from "@/components/ui-primitives/alert";
import { PageError } from "@/components/page/page-error";
import { Badge } from "@/components/ui-primitives/badge";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/get-files";
import { InlineTagsList } from "@/components/tag/inline-tags-list";
import {
  ContentDetailsTable,
  FileActionButtons,
  FileDetailSkeleton,
  FileInfoTable,
  FilePageHeader,
  FileViewer,
  MimeIcon,
} from "@/components/file-detail";

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
    <div className="flex w-full flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <FileViewer
          fileId={fileIdNum}
          mime={data.mime}
          isDeleted={data.is_deleted && !data.is_trashed}
        />

        <FilePageHeader fileId={fileIdNum} />
        <Separator className="my-2" />
        <div className="flex flex-wrap items-center gap-2">
          {data.is_inbox ? (
            <Badge variant="secondary">
              <InboxIcon className="mr-1 size-3" />
              Inbox
            </Badge>
          ) : (
            <Badge variant="secondary">
              <ArchiveBoxIcon className="mr-1 size-3" />
              Archived
            </Badge>
          )}
          {data.is_trashed && (
            <Badge variant="destructive">
              <TrashIcon className="mr-1 size-3" />
              Trashed
            </Badge>
          )}
          {data.is_deleted && !data.is_trashed && (
            <Badge variant="destructive">
              <NoSymbolIcon className="mr-1 size-3" />
              Permanently deleted
            </Badge>
          )}
          <Badge variant="outline">
            <MimeIcon mime={data.mime} className="mr-1 size-3" />
            {data.mime}
          </Badge>
          {data.has_audio && (
            <Badge variant="outline">
              <SpeakerWaveIcon className="mr-1 size-3" /> Has audio
            </Badge>
          )}
        </div>
        <Separator className="my-2" />

        <FileActionButtons fileId={fileIdNum} />
        <Separator className="my-2" />

        <div className="@container space-y-4">
          <Heading level={2}>File metadata</Heading>
          <div className="grid gap-4 @lg:grid-cols-2">
            <ContentDetailsTable data={data} />
            <FileInfoTable data={data} />
          </div>
        </div>
        <Separator className="my-2" />
        <InlineTagsList data={data} />
      </div>
    </div>
  );
}
