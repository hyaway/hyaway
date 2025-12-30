import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/page/empty-state";
import { PageError } from "@/components/page/page-error";
import { PageFloatingBar } from "@/components/page/page-floating-bar";
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
import { RefetchButton } from "@/components/refetch-button";
import { RecentFilesSettingsPopover } from "@/components/settings/recent-files-settings-popover";
import { useRecentlyTrashedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";

export const Route = createFileRoute("/_auth/recently-deleted")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Recently trashed",
  }),
});

function RouteComponent() {
  const { data, isLoading, isFetching, isError, error } =
    useRecentlyTrashedFilesQuery();
  const queryClient = useQueryClient();

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
        <PageFloatingBar
          leftContent={refetchButton}
          rightContent={<RecentFilesSettingsPopover />}
        />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="pb-16">
          <PageHeading title="Recently trashed" />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching recently trashed files."
          />
        </div>
        <PageFloatingBar
          leftContent={refetchButton}
          rightContent={<RecentFilesSettingsPopover />}
        />
      </>
    );
  }

  return (
    <>
      <div className="pb-16">
        <PageHeading
          title={`Recently trashed (${data?.file_ids?.length ?? 0} files)`}
        />
        {data?.file_ids && data.file_ids.length > 0 ? (
          <ImageGrid fileIds={data.file_ids} />
        ) : (
          <EmptyState message="No recently trashed files found." />
        )}
      </div>
      <PageFloatingBar
        leftContent={refetchButton}
        rightContent={<RecentFilesSettingsPopover />}
      />
    </>
  );
}
