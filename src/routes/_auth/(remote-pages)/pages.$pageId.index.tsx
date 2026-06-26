// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { IconFocusCentered, IconRefreshDot } from "@tabler/icons-react";
import { useEffect } from "react";
import { PageGroupPathForPage } from "./-components/page-group-path";
import { useResolvedPage } from "./-hooks/use-resolved-page";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ThumbnailGalleryFloatingFooter } from "@/components/thumbnail-gallery/thumbnail-gallery-floating-footer";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import { ThumbnailGalleryDisplaySettingsPopover } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import { useThumbnailGalleryModel } from "@/components/thumbnail-gallery/use-thumbnail-gallery-model";
import { PageState } from "@/integrations/hydrus-api/models";
import {
  useFocusPageMutation,
  useGetPageInfoQuery,
  useRefreshPageMutation,
} from "@/integrations/hydrus-api/queries/manage-pages";
import { useLatestOpenedPageActions } from "@/stores/latest-opened-page-store";

const PAGE_STATE_LABELS: Partial<Record<PageState, string>> = {
  [PageState.INITIALIZING]: "Initializing",
  [PageState.SEARCHING_LOADING]: "Searching",
};

export const Route = createFileRoute("/_auth/(remote-pages)/pages/$pageId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { pageId } = Route.useParams();
  const resolved = useResolvedPage({ pageId });

  if (resolved.status === "loading") {
    return (
      <>
        <PageLoading title={`Page: ${pageId.slice(0, 8)}...`} />
        <PageHeaderActions>
          <ThumbnailGalleryDisplaySettingsPopover />
        </PageHeaderActions>
      </>
    );
  }

  if (resolved.status === "not-found") {
    return (
      <>
        <PageHeading title="Page not found" />
        <EmptyState
          message={`No page found matching "${pageId}". The page may have been closed or Hydrus was restarted.`}
        />
      </>
    );
  }

  return (
    <PageContent
      resolvedPageKey={resolved.page.page_key}
      resolvedPageName={resolved.page.name}
      resolvedPageSlug={resolved.page.slug}
    />
  );
}

function PageContent({
  resolvedPageKey,
  resolvedPageName,
  resolvedPageSlug,
}: {
  resolvedPageKey: string;
  resolvedPageName: string;
  resolvedPageSlug: string;
}) {
  const { data, isLoading, isFetching, isError, error } = useGetPageInfoQuery(
    resolvedPageKey,
    true,
  );
  const refreshPageMutation = useRefreshPageMutation();
  const focusPageMutation = useFocusPageMutation();
  const queryClient = useQueryClient();
  const { setLatestOpenedPage } = useLatestOpenedPageActions();
  const pagePath = (
    <PageGroupPathForPage
      pageKey={resolvedPageKey}
      size="sidebar"
      linkSegmentsToPagesSearch
    />
  );

  // Get file IDs for review queue
  const fileIds = data?.page_info.media.hash_ids ?? [];
  const reviewSource = {
    type: "remotePage",
    pageKey: resolvedPageKey,
  } as const;
  const {
    metadataQuery,
    shouldLoadAllMetadata,
    loadAllMetadataAction,
    visibleFileIds,
    hiddenLabel,
    showHiddenFilesAction,
    galleryView,
  } = useThumbnailGalleryModel({
    fileIds,
    hiddenFileViewData: data,
    reviewSource,
  });

  useEffect(() => {
    setLatestOpenedPage({
      pageKey: resolvedPageKey,
      pageSlug: resolvedPageSlug,
      pageName: resolvedPageName,
    });
  }, [
    resolvedPageKey,
    resolvedPageName,
    resolvedPageSlug,
    setLatestOpenedPage,
  ]);

  // Determine if page is in a loading/initializing state
  const pageState = data?.page_info.page_state;
  const isInitializing =
    pageState === PageState.INITIALIZING ||
    pageState === PageState.SEARCHING_LOADING;
  const initializingLabel = pageState
    ? PAGE_STATE_LABELS[pageState]
    : undefined;

  // Link builder for contextual navigation - use slug for prettier URLs
  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/pages/$pageId/$fileId",
      params: { pageId: resolvedPageSlug, fileId: String(fileId) },
    });

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching || isInitializing}
      label={initializingLabel}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: ["getPageInfo", resolvedPageKey],
        })
      }
    />
  );

  const overflowActions: Array<FloatingFooterAction> = [
    {
      id: "refresh-remote",
      label: "Refresh remote",
      icon: IconRefreshDot,
      onClick: () => refreshPageMutation.mutate(resolvedPageKey),
      isPending: refreshPageMutation.isPending,
      overflowOnly: true,
    },
    {
      id: "focus-remote",
      label: "Focus remote",
      icon: IconFocusCentered,
      onClick: () => focusPageMutation.mutate(resolvedPageKey),
      isPending: focusPageMutation.isPending,
      overflowOnly: true,
    },
    loadAllMetadataAction,
    ...(showHiddenFilesAction ? [showHiddenFilesAction] : []),
  ];

  if (isLoading || isInitializing) {
    const title = `Page: ${resolvedPageName}`;
    return (
      <>
        <PageLoading title={title} eyebrow={pagePath} />
        <PageHeaderActions>
          <ThumbnailGalleryDisplaySettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter
          leftContent={refetchButton}
          actions={overflowActions}
        />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <>
          <PageHeading title={`Page: ${resolvedPageName}`} eyebrow={pagePath} />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching pages."
          />
        </>
        <PageHeaderActions>
          <ThumbnailGalleryDisplaySettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter
          leftContent={refetchButton}
          actions={overflowActions}
        />
      </>
    );
  }

  return (
    <>
      <>
        <PageHeading
          title={`Page: ${data?.page_info.name} (${visibleFileIds.length} files${hiddenLabel ? `, ${hiddenLabel}` : ""})`}
          eyebrow={pagePath}
        />
        {data?.page_info.media ? (
          <ThumbnailGalleryProvider
            reviewFileIds={galleryView.reviewFileIds}
            reviewSource={reviewSource}
          >
            <ThumbnailGallery
              sourceFileIds={data.page_info.media.hash_ids}
              metadataQuery={metadataQuery}
              galleryView={galleryView}
              loadAll={shouldLoadAllMetadata}
              getFileLink={getFileLink}
            />
            <ThumbnailGalleryFloatingFooter
              leftContent={refetchButton}
              actions={overflowActions}
            />
          </ThumbnailGalleryProvider>
        ) : (
          <p>This page has no media.</p>
        )}
      </>
      <PageHeaderActions>
        <ThumbnailGalleryDisplaySettingsPopover />
      </PageHeaderActions>
      {!data?.page_info.media && (
        <PageFloatingFooter
          leftContent={refetchButton}
          actions={overflowActions}
        />
      )}
    </>
  );
}
