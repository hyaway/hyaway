// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconBookDownload } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import { useInfiniteGetFilesMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { fileIdsFingerprint } from "@/lib/file-ids-fingerprint";
import { useLoadAllMetadataByDefault } from "@/stores/metadata-settings-store";

interface ThumbnailGalleryLoadAllOptions {
  loadAllWhen?: boolean;
}

export function useThumbnailGalleryLoadAll(
  fileIds: Array<number>,
  { loadAllWhen = false }: ThumbnailGalleryLoadAllOptions = {},
) {
  const loadAllMetadataByDefault = useLoadAllMetadataByDefault();
  const [loadAllMetadataKey, setLoadAllMetadataKey] = useState<string | null>(
    null,
  );

  const metadataKey = fileIdsFingerprint(fileIds).join(":");
  const itemsQuery = useInfiniteGetFilesMetadata(fileIds, false);
  const loadedAllMetadata =
    fileIds.length > 0 &&
    !itemsQuery.hasNextPage &&
    !itemsQuery.isFetchingNextPage;
  const loadAllMetadata =
    (loadAllMetadataByDefault ||
      loadAllWhen ||
      loadAllMetadataKey === metadataKey) &&
    !loadedAllMetadata;
  const label = loadedAllMetadata
    ? `Loaded all metadata`
    : loadAllMetadata
      ? `Loading all metadata`
      : `Load all metadata (${fileIds.length})`;

  const loadAllMetadataAction = useMemo(
    (): FloatingFooterAction => ({
      id: "load-all-items",
      label,
      icon: IconBookDownload,
      onClick: () => setLoadAllMetadataKey(metadataKey),
      disabled: fileIds.length === 0 || loadAllMetadata || loadedAllMetadata,
      isPending: loadAllMetadata && !loadedAllMetadata,
      overflowOnly: true,
    }),
    [fileIds.length, label, loadAllMetadata, loadedAllMetadata, metadataKey],
  );

  return {
    itemsQuery,
    loadAllMetadata,
    loadedAllMetadata,
    loadAllMetadataAction,
  };
}
