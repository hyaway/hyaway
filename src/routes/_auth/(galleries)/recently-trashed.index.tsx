import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { RecentFilesSettingsPopover } from "./-components/recent-files-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { useRecentlyTrashedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";

export const Route = createFileRoute("/_auth/(galleries)/recently-trashed/")({
  component: RouteComponent,
});

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
        <PageLoading title="Recently trashed" />
        <PageFloatingFooter
          leftContent={refetchButton}
          rightContent={<RecentFilesSettingsPopover />}
        />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <>
          <PageHeading title="Recently trashed" />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching recently trashed files."
          />
        </>
        <PageFloatingFooter
          leftContent={refetchButton}
          rightContent={<RecentFilesSettingsPopover />}
        />
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
          <ThumbnailGallery fileIds={data.file_ids} getFileLink={getFileLink} />
        ) : (
          <EmptyState message="No recently trashed files found." />
        )}
      </>
      <PageFloatingFooter
        leftContent={refetchButton}
        rightContent={<RecentFilesSettingsPopover />}
      />
    </>
  );
}
