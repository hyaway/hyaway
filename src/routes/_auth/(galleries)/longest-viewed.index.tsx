import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LongestViewedSettingsPopover } from "./-components/longest-viewed-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { useLongestViewedFilesQuery } from "@/integrations/hydrus-api/queries/search";

export const Route = createFileRoute("/_auth/(galleries)/longest-viewed/")({
  component: RouteComponent,
});

const PAGE_TITLE = "Longest viewed";

function RouteComponent() {
  const { data, isLoading, isFetching, isError, error } =
    useLongestViewedFilesQuery();
  const queryClient = useQueryClient();

  // Link builder for contextual navigation
  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/longest-viewed/$fileId",
      params: { fileId: String(fileId) },
    });

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: ["searchFiles", "longestViewed"],
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
          rightContent={<LongestViewedSettingsPopover />}
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
            fallbackMessage="An unknown error occurred while fetching longest viewed files."
          />
        </>
        <PageFloatingFooter
          leftContent={refetchButton}
          rightContent={<LongestViewedSettingsPopover />}
        />
      </>
    );
  }

  return (
    <>
      <>
        <PageHeading
          title={`Longest viewed (${data?.file_ids?.length ?? 0} files)`}
        />
        {data?.file_ids && data.file_ids.length > 0 ? (
          <ThumbnailGalleryProvider infoMode="viewtime">
            <ThumbnailGallery
              fileIds={data.file_ids}
              getFileLink={getFileLink}
            />
          </ThumbnailGalleryProvider>
        ) : (
          <EmptyState message="No files with view time found." />
        )}
      </>
      <PageFloatingFooter
        leftContent={refetchButton}
        rightContent={<LongestViewedSettingsPopover />}
      />
    </>
  );
}
