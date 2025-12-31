import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingBar } from "@/components/page-shell/page-floating-bar";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { RecentFilesSettingsPopover } from "./-components/recent-files-settings-popover";
import { useRecentlyArchivedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";

export const Route = createFileRoute("/_auth/(galleries)/recently-archived")({
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
          <PageHeading title="Recently archived" />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching recently archived files."
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
          title={`Recently archived (${data?.file_ids?.length ?? 0} files)`}
        />
        {data?.file_ids && data.file_ids.length > 0 ? (
          <ImageGrid fileIds={data.file_ids} />
        ) : (
          <EmptyState message="No recently archived files found." />
        )}
      </div>
      <PageFloatingBar
        leftContent={refetchButton}
        rightContent={<RecentFilesSettingsPopover />}
      />
    </>
  );
}
