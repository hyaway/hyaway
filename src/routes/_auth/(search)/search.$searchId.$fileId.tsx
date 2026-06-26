// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useCommittedSearchFilesQuery } from "./-hooks/use-committed-search-query";
import { FileDetail } from "@/components/file-detail/file-detail";
import {
  getNavigationFileIds,
  useThumbnailGalleryView,
} from "@/components/thumbnail-gallery/use-thumbnail-gallery-view";
import { useFileContextNavigation } from "@/hooks/use-file-context-navigation";
import { getHiddenFileIds } from "@/integrations/hydrus-api/queries/file-metadata-cache";
import { useInfiniteGetFilesMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { isNamespaceSortConfig } from "@/stores/search-defaults";
import { useCommittedSearch } from "@/stores/search-queries-store";

export const Route = createFileRoute(
  "/_auth/(search)/search/$searchId/$fileId",
)({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `File ${params.fileId}`,
  }),
});

function RouteComponent() {
  const { searchId, fileId } = Route.useParams();
  const fileIdNum = Number(fileId);

  const { data, isLoading, isError } = useCommittedSearchFilesQuery(searchId);
  const committed = useCommittedSearch(searchId);
  const namespaceSort =
    committed && isNamespaceSortConfig(committed.sort)
      ? committed.sort
      : undefined;

  const sourceFileIds = data?.file_ids ?? [];
  const hiddenFileIds = data ? getHiddenFileIds(data) : undefined;
  const itemsQuery = useInfiniteGetFilesMetadata(
    namespaceSort ? sourceFileIds : [],
    false,
  );
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = itemsQuery;
  const galleryView = useThumbnailGalleryView({
    sourceFileIds,
    data: itemsQuery.data,
    hiddenFileIds,
    namespaceSort,
  });
  const currentFileIsVisibleSource = data
    ? galleryView.visibleFileIds.includes(fileIdNum)
    : false;
  const navigationFileIds = getNavigationFileIds({
    visibleFileIds: galleryView.visibleFileIds,
    visibleLoadedFileIds: galleryView.visibleLoadedFileIds,
    namespaceSort,
  });
  const currentFileIsInNavigation = navigationFileIds.includes(fileIdNum);
  const shouldResolveNamespaceNavigation =
    !!namespaceSort &&
    !!data &&
    currentFileIsVisibleSource &&
    !currentFileIsInNavigation;
  const shouldFetchNamespaceNavigationPage =
    shouldResolveNamespaceNavigation && !!hasNextPage && !isFetchingNextPage;

  useEffect(() => {
    if (!shouldFetchNamespaceNavigationPage) return;
    void fetchNextPage();
  }, [fetchNextPage, shouldFetchNamespaceNavigationPage]);

  const fileIds = data
    ? namespaceSort && currentFileIsVisibleSource && !currentFileIsInNavigation
      ? [fileIdNum]
      : navigationFileIds
    : undefined;

  const buildParams = (fid: number) => ({
    searchId,
    fileId: String(fid),
  });

  const { navActions, shouldFallback } = useFileContextNavigation({
    fileId: fileIdNum,
    fileIds,
    isLoading,
    isError,
    contextRoute: "/search/$searchId/$fileId",
    buildParams,
  });

  if (shouldFallback) {
    return null;
  }

  return <FileDetail fileId={fileIdNum} prependActions={navActions} />;
}
