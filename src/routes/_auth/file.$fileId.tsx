import {
  createFileRoute,
  useCanGoBack,
  useRouter,
} from "@tanstack/react-router";
import { AxiosError } from "axios";
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
  InboxIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Badge } from "@/components/ui-primitives/badge";
import { Button } from "@/components/ui-primitives/button";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { HeaderPortal } from "@/components/header-portal";
import { TagsSidebar } from "@/components/image-grid/tags-sidebar";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/get-files";
import { useFullFileIdUrl } from "@/hooks/use-url-with-api-key";

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
        <HeaderPortal>
          <FilePageHeader fileId={fileIdNum} />
        </HeaderPortal>
        <Alert variant="destructive">
          <ExclamationCircleIcon />
          <AlertTitle>
            {error instanceof Error
              ? error.message
              : "An unknown error occurred while fetching file."}
          </AlertTitle>
          <AlertDescription>
            {error instanceof AxiosError && error.response?.data?.error ? (
              <span>{error.response.data.error}</span>
            ) : null}
          </AlertDescription>
        </Alert>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <HeaderPortal>
          <FilePageHeader fileId={fileIdNum} />
        </HeaderPortal>
        <Alert variant="destructive">
          <ExclamationCircleIcon />
          <AlertTitle>File not found</AlertTitle>
        </Alert>
      </>
    );
  }

  return (
    <div className="flex w-full flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderPortal>
          <FilePageHeader fileId={fileIdNum} />
          <Separator className="my-2" />
          <div className="flex flex-wrap items-center gap-2">
            {data.is_inbox && (
              <Badge variant="secondary">
                <InboxIcon className="mr-1 size-3" />
                Inbox
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
                <ExclamationCircleIcon className="mr-1 size-3" />
                Deleted
              </Badge>
            )}
            <Badge variant="outline">{data.filetype_human}</Badge>
            <Badge variant="outline">{data.mime}</Badge>
          </div>
          <Separator className="my-2" />
        </HeaderPortal>

        <FileViewer fileId={fileIdNum} mime={data.mime} />

        <div className="mt-4 space-y-4">
          <Heading level={3}>File metadata</Heading>
          <FileMetadataTable data={data} />
        </div>
      </div>

      <TagsSidebar items={[data]} />
    </div>
  );
}

function FileViewer({ fileId, mime }: { fileId: number; mime: string }) {
  const fileUrl = useFullFileIdUrl(fileId);

  // Determine file type from MIME
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isAudio = mime.startsWith("audio/");

  if (isImage) {
    return (
      <div className="flex justify-center">
        <img
          src={fileUrl}
          alt={`File ${fileId}`}
          className="max-h-[70vh] max-w-full rounded border object-contain"
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="flex justify-center">
        <video
          src={fileUrl}
          controls
          className="max-h-[70vh] max-w-full rounded border"
        >
          Your browser does not support the video element.
        </video>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="flex justify-center p-4">
        <audio src={fileUrl} controls className="w-full max-w-md">
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // Fallback for other types - try to embed or show download link
  return (
    <div className="flex flex-col items-center gap-4 rounded border p-8">
      <p className="text-muted-foreground">
        This file type ({mime}) may not be viewable in the browser.
      </p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline"
      >
        Open file in new tab
      </a>
    </div>
  );
}

function FilePageHeader({ fileId }: { fileId: number }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <div className="flex items-center gap-2">
      {canGoBack && (
        <Button
          onClick={() => router.history.back()}
          variant="ghost"
          size="icon"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
      )}
      <Heading>File: {fileId}</Heading>
    </div>
  );
}

function FileMetadataTable({
  data,
}: {
  data: NonNullable<ReturnType<typeof useGetSingleFileMetadata>["data"]>;
}) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return null;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  };

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "File ID", value: data.file_id },
    {
      label: "Hash",
      value: <code className="text-xs break-all">{data.hash}</code>,
    },
    { label: "File Type", value: data.filetype_human },
    { label: "MIME Type", value: data.mime },
    { label: "Extension", value: data.ext },
    { label: "Size", value: formatBytes(data.size) },
    { label: "Dimensions", value: `${data.width} × ${data.height}` },
  ];

  if (data.duration !== null) {
    rows.push({ label: "Duration", value: formatDuration(data.duration) });
  }

  if (data.num_frames !== null) {
    rows.push({ label: "Frames", value: data.num_frames });
  }

  if (data.num_words !== null) {
    rows.push({ label: "Words", value: data.num_words });
  }

  rows.push({ label: "Has Audio", value: data.has_audio ? "Yes" : "No" });

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-muted-foreground font-medium">{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FileDetailSkeleton({ fileId }: { fileId: number }) {
  return (
    <div className="flex w-full flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderPortal>
          <FilePageHeader fileId={fileId} />
          <Separator className="my-2" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Separator className="my-2" />
        </HeaderPortal>

        {/* File viewer skeleton */}
        <div className="flex justify-center">
          <Skeleton className="aspect-video w-full max-w-2xl rounded" />
        </div>

        {/* Metadata skeleton */}
        <div className="mt-4 space-y-4">
          <Skeleton className="h-6 w-36" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="contents">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Tags sidebar skeleton space */}
      <div className="hidden w-64 lg:block" />
    </div>
  );
}
