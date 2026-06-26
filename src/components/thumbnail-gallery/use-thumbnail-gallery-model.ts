// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useThumbnailGalleryMetadataLoader } from "./use-thumbnail-gallery-metadata-loader";
import { useThumbnailGalleryView } from "./use-thumbnail-gallery-view";
import type { ViewCacheData } from "@/integrations/hydrus-api/queries/file-metadata-cache";
import type { NamespaceSortConfig } from "@/stores/search-defaults";
import type { ReviewSource } from "@/stores/review-queue-store";
import { useHiddenFileView } from "@/hooks/use-hidden-file-view";

export function useThumbnailGalleryModel({
  fileIds,
  hiddenFileViewData,
  reviewSource,
  namespaceSort,
  requestAllMetadata,
}: {
  fileIds: Array<number>;
  hiddenFileViewData?: ViewCacheData | null;
  reviewSource?: ReviewSource;
  namespaceSort?: NamespaceSortConfig;
  requestAllMetadata?: boolean;
}) {
  const {
    metadataQuery,
    shouldLoadAllMetadata,
    hasLoadedAllMetadata,
    loadAllMetadataAction,
  } = useThumbnailGalleryMetadataLoader(fileIds, { requestAllMetadata });
  const { hiddenFileIds, visibleFileIds, hiddenLabel, showHiddenFilesAction } =
    useHiddenFileView({
      data: hiddenFileViewData,
      fileIds,
      source: reviewSource,
    });
  const galleryView = useThumbnailGalleryView({
    sourceFileIds: fileIds,
    data: metadataQuery.data,
    hiddenFileIds,
    namespaceSort,
  });

  return {
    metadataQuery,
    shouldLoadAllMetadata,
    hasLoadedAllMetadata,
    loadAllMetadataAction,
    hiddenFileIds,
    visibleFileIds,
    hiddenLabel,
    showHiddenFilesAction,
    galleryView,
  };
}
