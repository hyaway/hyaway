import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/page/empty-state";
import { PageError } from "@/components/page/page-error";
import { PageFloatingBar } from "@/components/page/page-floating-bar";
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
import { RefetchButton } from "@/components/refetch-button";
import { RecentFilesSettingsPopover } from "@/components/settings/recent-files-settings-popover";
import { useRecentlyArchivedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";

export const Route = createFileRoute("/_auth/recently-archived")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Recently archived",
  }),
});

function RouteComponent() {
  const { data, isLoading, isFetching, isError, error } =
    useRecentlyArchivedFilesQuery();
  const queryClient = useQueryClient();

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: ["searchFiles", "recentlyArchived"],
        })
      }
    />
  );

  if (isLoading) {
    return (
      <>
        <PageLoading title="Recently archived" />
        <PageFloatingBar
          leftActions={refetchButton}
          rightActions={<RecentFilesSettingsPopover />}
        />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="pb-16">
          <PageHeading title="Recently archived" />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching recently archived files."
          />
        </div>
        <PageFloatingBar
          leftActions={refetchButton}
          rightActions={<RecentFilesSettingsPopover />}
        />
      </>
    );
  }

  return (
    <>
      <div className="pb-16">
        <PageHeading
          title={`Recently archived (${data?.file_ids?.length ?? 0} files)`}
        />
        {data?.file_ids && data.file_ids.length > 0 ? (
          <ImageGrid fileIds={data.file_ids} />
        ) : (
          <EmptyState message="No recently archived files found." />
        )}
      </div>
      <PageFloatingBar
        leftActions={refetchButton}
        rightActions={<RecentFilesSettingsPopover />}
      />
    </>
  );
}
