import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { RecentFilesSettingsPopover } from "./-components/recent-files-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import { useReviewActions } from "@/hooks/use-review-actions";
import { useRecentlyInboxedFilesQuery } from "@/integrations/hydrus-api/queries/search";

export const Route = createFileRoute("/_auth/(galleries)/recently-inboxed/")({
  component: RouteComponent,
});

const PAGE_TITLE = "Recently inboxed";

function RouteComponent() {
  const { data, isLoading, isFetching, isError, error } =
    useRecentlyInboxedFilesQuery();
  const queryClient = useQueryClient();

  const fileIds = data?.file_ids ?? [];
  const hasFiles = fileIds.length > 0;
  const reviewActions = useReviewActions({ fileIds });

  // Link builder for contextual navigation
  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/recently-inboxed/$fileId",
      params: { fileId: String(fileId) },
    });

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: ["searchFiles", "recentlyInboxed"],
        })
      }
    />
  );

  if (isLoading) {
    return (
      <>
        <PageLoading title={PAGE_TITLE} />
        <PageHeaderActions>
          <RecentFilesSettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter leftContent={refetchButton} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <>
          <PageHeading title={PAGE_TITLE} />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching recently inboxed files."
          />
        </>
        <PageHeaderActions>
          <RecentFilesSettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter leftContent={refetchButton} />
      </>
    );
  }

  return (
    <>
      <>
        <PageHeading
          title={`Recently inboxed (${data?.file_ids?.length ?? 0} files)`}
        />
        {hasFiles ? (
          <ThumbnailGalleryProvider fileIds={fileIds}>
            <ThumbnailGallery fileIds={fileIds} getFileLink={getFileLink} />
          </ThumbnailGalleryProvider>
        ) : (
          <EmptyState message="No recently inboxed files found." />
        )}
      </>
      <PageHeaderActions>
        <RecentFilesSettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter leftContent={refetchButton} actions={reviewActions} />
    </>
  );
}
