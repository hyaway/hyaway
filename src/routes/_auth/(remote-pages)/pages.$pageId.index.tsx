import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { IconFocusCentered, IconRefreshDot } from "@tabler/icons-react";
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
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { ThumbnailGalleryDisplaySettingsPopover } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import { useReviewActions } from "@/hooks/use-review-actions";
import { PageState } from "@/integrations/hydrus-api/models";
import {
  useFocusPageMutation,
  useGetPageInfoQuery,
  useRefreshPageMutation,
} from "@/integrations/hydrus-api/queries/manage-pages";

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

  // Get file IDs for review queue
  const fileIds = data?.page_info.media?.hash_ids ?? [];
  const reviewActions = useReviewActions({ fileIds });

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
  ];

  if (isLoading || isInitializing) {
    const title = `Page: ${resolvedPageName}`;
    return (
      <>
        <PageLoading title={title} />
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
          <PageHeading title={`Page: ${resolvedPageName}`} />
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
          title={`Page: ${data?.page_info.name} (${data?.page_info.media.num_files ?? 0} files)`}
        />
        {data?.page_info.media ? (
          <ThumbnailGallery
            fileIds={data.page_info.media.hash_ids}
            getFileLink={getFileLink}
          />
        ) : (
          <p>This page has no media.</p>
        )}
      </>
      <PageHeaderActions>
        <ThumbnailGalleryDisplaySettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter
        leftContent={refetchButton}
        actions={[...reviewActions, ...overflowActions]}
      />
    </>
  );
}
