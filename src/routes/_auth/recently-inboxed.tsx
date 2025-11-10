import { createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { Heading } from "@/components/ui/heading";
import { Loader } from "@/components/ui/loader";
import { Note } from "@/components/ui/note";
import { Separator } from "@/components/ui/separator";
import { useRecentlyInboxedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/recently-inboxed")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading, isError, error } = useRecentlyInboxedFilesQuery();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <Note intent="danger">
        {error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching recently inboxed files."}
        <br />
        {error instanceof AxiosError && error.response?.data?.error && (
          <span>{error.response.data.error}</span>
        )}
      </Note>
    );
  }

  return (
    <div>
      <Heading>Recently inboxed</Heading>
      <Separator className="my-2" />
      <Button
        onPress={() =>
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
