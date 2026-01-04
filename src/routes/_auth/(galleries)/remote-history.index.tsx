import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { RemoteHistorySettingsPopover } from "./-components/remote-history-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { useRemoteWatchHistoryQuery } from "@/integrations/hydrus-api/queries/search";

export const Route = createFileRoute("/_auth/(galleries)/remote-history/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading, isFetching, isError, error } =
    useRemoteWatchHistoryQuery();
  const queryClient = useQueryClient();

  // Link builder for contextual navigation
  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/remote-history/$fileId",
      params: { fileId: String(fileId) },
    });

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: ["searchFiles", "remoteWatchHistory"],
        })
      }
    />
  );

  if (isLoading) {
    return (
      <>
        <PageLoading title="Remote watch history" />
        <PageFloatingFooter
          leftContent={refetchButton}
          rightContent={<RemoteHistorySettingsPopover />}
        />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <>
          <PageHeading title="Remote watch history" />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching remote watch history."
          />
        </>
        <PageFloatingFooter
          leftContent={refetchButton}
          rightContent={<RemoteHistorySettingsPopover />}
        />
      </>
    );
  }

  return (
    <>
      <>
        <PageHeading
          title={`Remote watch history (${data?.file_ids?.length ?? 0} files)`}
        />
        {data?.file_ids && data.file_ids.length > 0 ? (
          <ThumbnailGallery fileIds={data.file_ids} getFileLink={getFileLink} />
        ) : (
          <EmptyState message="No files with remote view history found." />
        )}
      </>
      <PageFloatingFooter
        leftContent={refetchButton}
        rightContent={<RemoteHistorySettingsPopover />}
      />
    </>
  );
}
