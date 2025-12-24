import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageError } from "@/components/page/page-error";
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
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
      <PageHeading
        title={`Recently archived (${data?.file_ids?.length ?? 0} files)`}
      />
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
        <ImageGrid fileIds={data.file_ids} />
      ) : (
        <p>No recently archived files found.</p>
      )}
    </div>
  );
}
