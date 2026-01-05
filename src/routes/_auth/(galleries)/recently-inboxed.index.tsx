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
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { useRecentlyInboxedFilesQuery } from "@/integrations/hydrus-api/queries/search";

export const Route = createFileRoute("/_auth/(galleries)/recently-inboxed/")({
  component: RouteComponent,
});

const PAGE_TITLE = "Recently inboxed";

function RouteComponent() {
  const { data, isLoading, isFetching, isError, error } =
    useRecentlyInboxedFilesQuery();
  const queryClient = useQueryClient();

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
          <PageHeading title={PAGE_TITLE} />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching recently inboxed files."
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
          title={`Recently inboxed (${data?.file_ids?.length ?? 0} files)`}
        />
        {data?.file_ids && data.file_ids.length > 0 ? (
          <ThumbnailGallery fileIds={data.file_ids} getFileLink={getFileLink} />
        ) : (
          <EmptyState message="No recently inboxed files found." />
        )}
      </>
      <PageFloatingFooter
        leftContent={refetchButton}
        rightContent={<RecentFilesSettingsPopover />}
      />
    </>
  );
}
