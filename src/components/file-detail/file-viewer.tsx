// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { AudioViewer } from "./viewers/audio-viewer";
import { DeletedFileViewer } from "./viewers/deleted-file-viewer";
import { ImageViewer } from "./viewers/image-viewer";
import { viewerFixedHeight } from "./viewers/style-constants";
import { UnsupportedFileViewer } from "./viewers/unsupported-file-viewer";
import { VideoViewer } from "./viewers/video-viewer";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Skeleton } from "@/components/ui-primitives/skeleton";
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
    return (
      <ImageViewer
        fileUrl={fileUrl}
        fileId={data.file_id}
        blurhash={data.blurhash ?? undefined}
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
