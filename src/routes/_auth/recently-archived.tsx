import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageError } from "@/components/page-error";
import { PageHeading } from "@/components/page-heading";
import { PageLoading } from "@/components/page-loading";
import { useRecentlyArchivedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { Button } from "@/components/ui-primitives/button";
import { Separator } from "@/components/ui-primitives/separator";

export const Route = createFileRoute("/_auth/recently-archived")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Recently archived",
  }),
});

function RouteComponent() {
  const { data, isLoading, isError, error } = useRecentlyArchivedFilesQuery();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <PageLoading title="Recently archived" buttonCount={1} />;
  }

  if (isError) {
    return (
      <PageError
        error={error}
        fallbackMessage="An unknown error occurred while fetching recently archived files."
      />
    );
  }

  return (
    <div>
      <PageHeading title="Recently archived" />
      <Button
        onClick={() =>
          queryClient.invalidateQueries({
            queryKey: ["searchFiles", "recentlyArchived"],
          })
        }
      >
        Refetch
      </Button>
      <Separator className="my-2" />

      {data?.file_ids && data.file_ids.length > 0 ? (
        <div>
          <p>Number of files: {data.file_ids.length}</p>
          <ImageGrid fileIds={data.file_ids} />
        </div>
      ) : (
        <p>No recently deleted files found.</p>
      )}
    </div>
  );
}
