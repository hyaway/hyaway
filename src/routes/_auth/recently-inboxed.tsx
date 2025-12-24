import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageError } from "@/components/page/page-error";
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
import { useRecentlyInboxedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { Button } from "@/components/ui-primitives/button";
import { Separator } from "@/components/ui-primitives/separator";

export const Route = createFileRoute("/_auth/recently-inboxed")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Recently inboxed",
  }),
});

function RouteComponent() {
  const { data, isLoading, isError, error } = useRecentlyInboxedFilesQuery();
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
      <PageHeading title="Recently inboxed" />
      <Button
        onClick={() =>
          queryClient.invalidateQueries({
            queryKey: ["searchFiles", "recentlyInboxed"],
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
