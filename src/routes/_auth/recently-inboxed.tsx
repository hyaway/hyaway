import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/page/empty-state";
import { PageError } from "@/components/page/page-error";
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
import { RefetchButton } from "@/components/refetch-button";
import { RecentFilesSettingsPopover } from "@/components/settings/recent-files-settings-popover";
import { useRecentlyInboxedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { Separator } from "@/components/ui-primitives/separator";

export const Route = createFileRoute("/_auth/recently-inboxed")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Recently inboxed",
  }),
});

function RouteComponent() {
  const { data, isLoading, isFetching, isError, error } =
    useRecentlyInboxedFilesQuery();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <PageLoading title="Recently inboxed" buttonCount={1} />;
  }

  if (isError) {
    return (
      <PageError
        error={error}
        fallbackMessage="An unknown error occurred while fetching recently inboxed files."
      />
    );
  }

  return (
    <div>
      <PageHeading
        title={`Recently inboxed (${data?.file_ids?.length ?? 0} files)`}
      />
      <div className="flex items-center gap-2">
        <RefetchButton
          isFetching={isFetching}
          onRefetch={() =>
            queryClient.invalidateQueries({
              queryKey: ["searchFiles", "recentlyInboxed"],
            })
          }
        />
        <div className="ml-auto">
          <RecentFilesSettingsPopover />
        </div>
      </div>
      <Separator className="my-2" />

      {data?.file_ids && data.file_ids.length > 0 ? (
        <ImageGrid fileIds={data.file_ids} />
      ) : (
        <EmptyState message="No recently inboxed files found." />
      )}
    </div>
  );
}
