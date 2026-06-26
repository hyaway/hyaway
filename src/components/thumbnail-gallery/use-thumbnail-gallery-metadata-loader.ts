// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconBookDownload } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import { useInfiniteGetFilesMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { fileIdsFingerprint } from "@/lib/file-ids-fingerprint";
import { useLoadAllMetadataByDefault } from "@/stores/metadata-settings-store";

interface ThumbnailGalleryMetadataLoaderOptions {
  requestAllMetadata?: boolean;
}

export function useThumbnailGalleryMetadataLoader(
  fileIds: Array<number>,
  { requestAllMetadata = false }: ThumbnailGalleryMetadataLoaderOptions = {},
) {
  const loadAllMetadataByDefault = useLoadAllMetadataByDefault();
  const [requestedAllMetadataKey, setRequestedAllMetadataKey] = useState<
    string | null
  >(null);

  const metadataKey = fileIdsFingerprint(fileIds).join(":");
  const metadataQuery = useInfiniteGetFilesMetadata(fileIds, false);
  const hasLoadedAllMetadata =
    fileIds.length > 0 &&
    !metadataQuery.hasNextPage &&
    !metadataQuery.isFetchingNextPage;
  const shouldLoadAllMetadata =
    (loadAllMetadataByDefault ||
      requestAllMetadata ||
      requestedAllMetadataKey === metadataKey) &&
    !hasLoadedAllMetadata;
  const label = hasLoadedAllMetadata
    ? `Loaded all metadata`
    : shouldLoadAllMetadata
      ? `Loading all metadata`
      : `Load all metadata (${fileIds.length})`;

  const loadAllMetadataAction = useMemo(
    (): FloatingFooterAction => ({
      id: "load-all-metadata",
      label,
      icon: IconBookDownload,
      onClick: () => setRequestedAllMetadataKey(metadataKey),
      disabled:
        fileIds.length === 0 || shouldLoadAllMetadata || hasLoadedAllMetadata,
      isPending: shouldLoadAllMetadata && !hasLoadedAllMetadata,
      overflowOnly: true,
    }),
    [
      fileIds.length,
      label,
      shouldLoadAllMetadata,
      hasLoadedAllMetadata,
      metadataKey,
    ],
  );

  return {
    metadataQuery,
    shouldLoadAllMetadata,
    hasLoadedAllMetadata,
    loadAllMetadataAction,
  };
}