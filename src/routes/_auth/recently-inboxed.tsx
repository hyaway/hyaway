import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageError } from "@/components/page-error";
import { Heading } from "@/components/ui-primitives/heading";
import { Spinner } from "@/components/ui-primitives/spinner";
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
    return <Spinner />;
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
      <Heading level={1}>Recently inboxed</Heading>
      <Separator className="my-2" />
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
