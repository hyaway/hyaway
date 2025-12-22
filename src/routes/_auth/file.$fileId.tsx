import { createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";
import {
  DocumentIcon,
  ExclamationCircleIcon,
  FilmIcon,
  InboxIcon,
  NoSymbolIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { NoSymbolIcon as NoSymbolIconLarge } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Badge } from "@/components/ui-primitives/badge";
import { Heading, Subheading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/get-files";
import { useFullFileIdUrl } from "@/hooks/use-url-with-api-key";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { TagStatus } from "@/integrations/hydrus-api/models";
import { TagBadgeFromString } from "@/components/tag-badge";
import { compareTagStrings } from "@/lib/tag-utils";
import { cn } from "@/lib/utils";

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
      <div className="flex min-w-0 flex-1 flex-col">
        <FileViewer
          fileId={fileIdNum}
          mime={data.mime}
          isDeleted={data.is_deleted && !data.is_trashed}
        />

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

function FileViewer({
  fileId,
  mime,
  isDeleted,
}: {
  fileId: number;
  mime: string;
  isDeleted?: boolean;
}) {
  const fileUrl = useFullFileIdUrl(fileId);

  if (isDeleted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded border p-8">
        <NoSymbolIconLarge className="text-muted-foreground size-12" />
        <p className="text-muted-foreground">
          This file has been deleted and is no longer available.
        </p>
      </div>
    );
  }

  // Determine file type from MIME
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isAudio = mime.startsWith("audio/");

  const [isExpanded, setIsExpanded] = useState(false);

  if (isImage) {
    return (
      <div className="flex justify-center">
        <img
          src={fileUrl}
          alt={`File ${fileId}`}
          className={cn(
            `max-w-full cursor-pointer rounded border object-contain transition-[max-height] duration-300`,
            isExpanded
              ? "max-h-full cursor-zoom-out"
              : "max-h-[70vh] cursor-zoom-in",
          )}
          onClick={() => {
            if (isExpanded) {
              window.scrollTo({ top: 0, behavior: "auto" });
            }
            setIsExpanded(!isExpanded);
          }}
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
  return (
    <Heading level={1} className="hidden">
      File: {fileId}
    </Heading>
  );
}

function MetadataList({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-muted-foreground font-medium select-all">
            {row.label}
          </dt>
          <dd className="select-all">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FileInfoTable({
  data,
}: {
  data: NonNullable<ReturnType<typeof useGetSingleFileMetadata>["data"]>;
}) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "File ID", value: data.file_id },
    {
      label: "Hash",
      value: <code className="font-mono break-all">{data.hash}</code>,
    },
    { label: "MIME Type", value: data.mime },
    { label: "File Type", value: data.filetype_human },
    { label: "Extension", value: data.ext },
  ];

  return <MetadataList rows={rows} />;
}

function ContentDetailsTable({
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
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: Array<string> = [];
    if (hours > 0) {
      parts.push(
        new Intl.NumberFormat(undefined, {
          style: "unit",
          unit: "hour",
        }).format(hours),
      );
    }
    if (minutes > 0) {
      parts.push(
        new Intl.NumberFormat(undefined, {
          style: "unit",
          unit: "minute",
        }).format(minutes),
      );
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(
        new Intl.NumberFormat(undefined, {
          style: "unit",
          unit: "second",
        }).format(seconds),
      );
    }
    return parts.join(" ");
  };

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Dimensions", value: `${data.width} × ${data.height}` },
    { label: "Size", value: formatBytes(data.size) },
  ];

  if (data.duration !== null) {
    rows.push({ label: "Duration", value: formatDuration(data.duration) });
  }

  if (data.num_frames !== null) {
    rows.push({
      label: "Frames",
      value: new Intl.NumberFormat().format(data.num_frames),
    });

    if (data.duration !== null && data.duration > 0) {
      const fps = data.num_frames / (data.duration / 1000);
      rows.push({
        label: "Framerate",
        value: `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(fps)} fps`,
      });
    }
  }

  if (data.num_words !== null) {
    rows.push({ label: "Words", value: data.num_words });
  }

  rows.push({ label: "Has Audio", value: data.has_audio ? "Yes" : "No" });

  return <MetadataList rows={rows} />;
}

function FileDetailSkeleton({ fileId }: { fileId: number }) {
  return (
    <div className="flex w-full flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* File viewer skeleton */}
        <div className="flex justify-center">
          <Skeleton className="aspect-video w-full max-w-2xl rounded" />
        </div>

        <FilePageHeader fileId={fileId} />
        <Separator className="my-2" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Separator className="my-2" />

        {/* Metadata skeleton */}
        <div className="space-y-4">
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

function MimeIcon({ mime, className }: { mime: string; className?: string }) {
  if (mime.startsWith("image/")) {
    return <PhotoIcon className={className} />;
  }
  if (mime.startsWith("video/")) {
    return <FilmIcon className={className} />;
  }
  if (mime.startsWith("audio/")) {
    return <SpeakerWaveIcon className={className} />;
  }
  return <DocumentIcon className={className} />;
}

function InlineTagsList({
  data,
}: {
  data: NonNullable<ReturnType<typeof useGetSingleFileMetadata>["data"]>;
}) {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;

  const tags = useMemo(() => {
    if (!allTagsServiceId) return [];

    const displayTags =
      data.tags?.[allTagsServiceId]?.display_tags[TagStatus.CURRENT];

    if (!displayTags) return [];

    return [...displayTags].sort(compareTagStrings);
  }, [data, allTagsServiceId]);

  if (tags.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No tags for this file.</p>
    );
  }

  return (
    <div className="space-y-4">
      <Heading level={2}>Tags ({tags.length})</Heading>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagBadgeFromString key={tag} displayTag={tag} />
        ))}
      </div>
    </div>
  );
}
