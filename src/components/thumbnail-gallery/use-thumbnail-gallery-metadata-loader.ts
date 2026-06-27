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

function getLoadAllMetadataLabel({
  fileCount,
  hasLoadedAllMetadata,
  isLoadingAllMetadata,
}: {
  fileCount: number;
  hasLoadedAllMetadata: boolean;
  isLoadingAllMetadata: boolean;
}) {
  if (hasLoadedAllMetadata) return "Loaded all metadata";
  if (isLoadingAllMetadata) return "Loading all metadata";
  return `Load all metadata (${fileCount})`;
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
  const isLoadAllMetadataRequested =
    loadAllMetadataByDefault ||
    requestAllMetadata ||
    requestedAllMetadataKey === metadataKey;
  const metadataQuery = useInfiniteGetFilesMetadata(fileIds, false, {
    loadAll: isLoadAllMetadataRequested,
  });
  const hasLoadedAllMetadata =
    fileIds.length > 0 &&
    !metadataQuery.hasNextPage &&
    !metadataQuery.isFetchingNextPage;
  const isLoadingAllMetadata =
    isLoadAllMetadataRequested && !hasLoadedAllMetadata;
  const label = getLoadAllMetadataLabel({
    fileCount: fileIds.length,
    hasLoadedAllMetadata,
    isLoadingAllMetadata,
  });

  const loadAllMetadataAction = useMemo(
    (): FloatingFooterAction => ({
      id: "load-all-metadata",
      label,
      icon: IconBookDownload,
      onClick: () => setRequestedAllMetadataKey(metadataKey),
      disabled:
        fileIds.length === 0 || isLoadingAllMetadata || hasLoadedAllMetadata,
      isPending: isLoadingAllMetadata,
      overflowOnly: true,
    }),
    [
      fileIds.length,
      label,
      isLoadingAllMetadata,
      hasLoadedAllMetadata,
      metadataKey,
    ],
  );

  return {
    metadataQuery,
    shouldLoadAllMetadata: isLoadingAllMetadata,
    hasLoadedAllMetadata,
    loadAllMetadataAction,
  };
}
