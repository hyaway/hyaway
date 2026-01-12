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
import { useRecentlyTrashedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";

export const Route = createFileRoute("/_auth/(galleries)/recently-trashed/")({
  component: RouteComponent,
});

const PAGE_TITLE = "Recently trashed";

function RouteComponent() {
  const { data, isLoading, isFetching, isError, error } =
    useRecentlyTrashedFilesQuery();
  const queryClient = useQueryClient();

  // Link builder for contextual navigation
  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/recently-trashed/$fileId",
      params: { fileId: String(fileId) },
    });

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: ["searchFiles", "recentlyTrashed"],
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
            fallbackMessage="An unknown error occurred while fetching recently trashed files."
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
          title={`Recently trashed (${data?.file_ids?.length ?? 0} files)`}
        />
        {data?.file_ids && data.file_ids.length > 0 ? (
          <ThumbnailGalleryProvider fileIds={data.file_ids}>
            <ThumbnailGallery
              fileIds={data.file_ids}
              getFileLink={getFileLink}
            />
          </ThumbnailGalleryProvider>
        ) : (
          <EmptyState message="No recently trashed files found." />
        )}
      </>
      <PageHeaderActions>
        <RecentFilesSettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter leftContent={refetchButton} />
    </>
  );
}
