import { useState } from "react";
import { AudioViewer } from "./viewers/audio-viewer";
import { DeletedFileViewer } from "./viewers/deleted-file-viewer";
import { ImageViewer } from "./viewers/image-viewer";
import { ImageViewerV2 } from "./viewers/image-viewer-v2";
import { viewerFixedHeight } from "./viewers/style-constants";
import { UnsupportedFileViewer } from "./viewers/unsupported-file-viewer";
import { VideoViewer } from "./viewers/video-viewer";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { Switch } from "@/components/ui-primitives/switch";
import { Label } from "@/components/ui-primitives/label";
import {
  RenderFormat,
  useFullFileIdUrl,
  useRenderFileIdUrl,
} from "@/hooks/use-url-with-api-key";
import { isImageProjectFile } from "@/lib/mime-utils";
import { cn } from "@/lib/utils";

export function FileViewerSkeleton() {
  return (
    <div className={cn("flex items-center justify-center", viewerFixedHeight)}>
      <Skeleton className="h-full w-full max-w-4xl rounded" />
    </div>
  );
}

export function FileViewer({ data }: { data: FileMetadata }) {
  // Debug toggle for switching between image viewer versions (temporary)
  const [useV2Viewer, setUseV2Viewer] = useState(true);

  // Check if this is an image project file (PSD, Krita) that needs rendering
  const projectFile = isImageProjectFile(data.mime);

  // Full file URL for regular files
  const fullUrl = useFullFileIdUrl(data.file_id);

  // Render URL for image project files - use full metadata dimensions
  const renderUrl = useRenderFileIdUrl(data.file_id, {
    renderFormat: RenderFormat.WEBP,
    renderQuality: 95,
    // Use metadata dimensions for full-size render
    width: data.width,
    height: data.height,
  });

  // Use render URL for project files, full URL otherwise
  const { url: fileUrl, onLoad, onError } = projectFile ? renderUrl : fullUrl;

  const isDeleted = data.is_deleted && !data.is_trashed;

  if (isDeleted) {
    return <DeletedFileViewer data={data} />;
  }

  // Determine file type from MIME
  // Image project files (PSD, Krita) should be treated as images
  const isImage = data.mime.startsWith("image/") || projectFile;
  const isVideo = data.mime.startsWith("video/");
  const isAudio = data.mime.startsWith("audio/");

  if (isImage) {
    const ImageComponent = useV2Viewer ? ImageViewerV2 : ImageViewer;
    return (
      <>
        {/* Debug toggle - remove after testing */}
        <div className="bg-muted/50 absolute top-10 left-2 z-50 flex items-center gap-2 rounded-md px-2 py-1 text-xs opacity-50 transition-opacity hover:opacity-100">
          <Switch
            id="viewer-toggle"
            checked={useV2Viewer}
            onCheckedChange={setUseV2Viewer}
          />
          <Label htmlFor="viewer-toggle" className="cursor-pointer">
            V2 Viewer
          </Label>
        </div>
        <ImageComponent
          fileUrl={fileUrl}
          fileId={data.file_id}
          blurhash={data.blurhash ?? undefined}
          onLoad={onLoad}
          onError={onError}
        />
      </>
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
