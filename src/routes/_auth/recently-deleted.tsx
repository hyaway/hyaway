import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/page/empty-state";
import { PageError } from "@/components/page/page-error";
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
import { RefetchButton } from "@/components/refetch-button";
import { useRecentlyDeletedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { Separator } from "@/components/ui-primitives/separator";

export const Route = createFileRoute("/_auth/recently-deleted")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Recently deleted",
  }),
});

function RouteComponent() {
  const { data, isLoading, isFetching, isError, error } =
    useRecentlyDeletedFilesQuery();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <PageLoading title="Recently deleted" buttonCount={1} />;
  }

  if (isError) {
    return (
      <PageError
        error={error}
        fallbackMessage="An unknown error occurred while fetching recently deleted files."
      />
    );
  }

  return (
    <div>
      <PageHeading
        title={`Recently deleted (${data?.file_ids?.length ?? 0} files)`}
      />
      <RefetchButton
        isFetching={isFetching}
        onRefetch={() =>
          queryClient.invalidateQueries({
            queryKey: ["searchFiles", "recentlyDeleted"],
          })
        }
      />
      <Separator className="my-2" />

      {data?.file_ids && data.file_ids.length > 0 ? (
        <ImageGrid fileIds={data.file_ids} />
      ) : (
        <EmptyState message="No recently deleted files found." />
      )}
    </div>
  );
}
