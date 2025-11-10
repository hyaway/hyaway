import { createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { Heading } from "@/components/ui/heading";
import { Loader } from "@/components/ui/loader";
import { Note } from "@/components/ui/note";
import { Separator } from "@/components/ui/separator";
import { useRecentlyArchivedFilesQuery } from "@/integrations/hydrus-api/queries";
import { ImageGrid } from "@/components/image-grid/image-grid";

export const Route = createFileRoute("/_auth/recently-archived")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading, isError, error } = useRecentlyArchivedFilesQuery();

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <Note intent="danger">
        {error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching recently archived files."}
        <br />
        {error instanceof AxiosError && error.response?.data?.error && (
          <span>{error.response.data.error}</span>
        )}
      </Note>
    );
  }

  return (
    <div>
      <Heading>Recently archived</Heading>
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
