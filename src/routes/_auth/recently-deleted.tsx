import { createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { ExclamationCircleIcon } from "@heroicons/react/16/solid";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Heading } from "@/components/ui-primitives/heading";
import { Spinner } from "@/components/ui-primitives/spinner";
import { HeaderPortal } from "@/components/header-portal";
import { useRecentlyDeletedFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { Button } from "@/components/ui-primitives/button";
import { Separator } from "@/components/ui-primitives/separator";

export const Route = createFileRoute("/_auth/recently-deleted")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Recently deleted",
  }),
});

function RouteComponent() {
  const { data, isLoading, isError, error } = useRecentlyDeletedFilesQuery();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <ExclamationCircleIcon />
        <AlertTitle>
          {error instanceof Error
            ? error.message
            : "An unknown error occurred while fetching recently deleted files."}
        </AlertTitle>
        <AlertDescription>
          {error instanceof AxiosError && error.response?.data?.error ? (
            <span>{error.response.data.error}</span>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <HeaderPortal>
        <Heading>Recently deleted</Heading>
      </HeaderPortal>
      <Button
        onClick={() =>
          queryClient.invalidateQueries({
            queryKey: ["searchFiles", "recentlyDeleted"],
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
