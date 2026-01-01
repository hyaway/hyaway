import { AudioViewer } from "./viewers/audio-viewer";
import { DeletedFileViewer } from "./viewers/deleted-file-viewer";
import { ImageViewer } from "./viewers/image-viewer";
import { viewerFixedHeight } from "./viewers/style-constants";
import { UnsupportedFileViewer } from "./viewers/unsupported-file-viewer";
import { VideoViewer } from "./viewers/video-viewer";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { useFullFileIdUrl } from "@/hooks/use-url-with-api-key";
import { cn } from "@/lib/utils";

export function FileViewerSkeleton() {
  return (
    <div className={cn("flex items-center justify-center", viewerFixedHeight)}>
      <Skeleton className="h-full w-full max-w-4xl rounded" />
    </div>
  );
}

export function FileViewer({ data }: { data: FileMetadata }) {
  const { url: fileUrl, onLoad, onError } = useFullFileIdUrl(data.file_id);

  const isDeleted = data.is_deleted && !data.is_trashed;

  if (isDeleted) {
    return <DeletedFileViewer data={data} />;
  }

  // Determine file type from MIME
  const isImage = data.mime.startsWith("image/");
  const isVideo = data.mime.startsWith("video/");
  const isAudio = data.mime.startsWith("audio/");

  if (isImage) {
    return (
      <ImageViewer
        fileUrl={fileUrl}
        fileId={data.file_id}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  if (isVideo) {
    return (
      <VideoViewer
        fileUrl={fileUrl}
        fileId={data.file_id}
        mime={data.mime}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  if (isAudio) {
    return (
      <AudioViewer
        fileUrl={fileUrl}
        fileId={data.file_id}
        mime={data.mime}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  return <UnsupportedFileViewer fileUrl={fileUrl} mime={data.mime} />;
}
