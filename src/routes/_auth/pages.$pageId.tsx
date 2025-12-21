import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ExclamationCircleIcon } from "@heroicons/react/16/solid";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Button } from "@/components/ui-primitives/button";
import { Heading } from "@/components/ui-primitives/heading";
import { Spinner } from "@/components/ui-primitives/spinner";
import { Separator } from "@/components/ui-primitives/separator";
import {
  useFocusPageMutation,
  useGetPageInfoQuery,
  useRefreshPageMutation,
} from "@/integrations/hydrus-api/queries/manage-pages";
import { ImageGrid } from "@/components/image-grid/image-grid";

export const Route = createFileRoute("/_auth/pages/$pageId")({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `Page ${params.pageId.slice(0, 8)}...`,
  }),
});

function RouteComponent() {
  const { pageId } = Route.useParams();
  const { data, isLoading, isError, error } = useGetPageInfoQuery(pageId, true);
  const refreshPageMutation = useRefreshPageMutation();
  const focusPageMutation = useFocusPageMutation();
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
            : "An unknown error occurred while fetching pages."}
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
      <Heading>Page: {data?.page_info.name}</Heading>
      <Separator className="my-2" />
      <div className="flex gap-2">
        <Button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["getPageInfo", pageId] })
          }
        >
          Refetch
        </Button>
        <Button onClick={() => refreshPageMutation.mutate(pageId)}>
          Refresh remote
        </Button>
        <Button onClick={() => focusPageMutation.mutate(pageId)}>Focus</Button>
      </div>
      <Separator className="my-2" />
      {data?.page_info.media ? (
        <div>
          <p>Number of files: {data.page_info.media.num_files}</p>
          <ImageGrid fileIds={data.page_info.media.hash_ids} />
        </div>
      ) : (
        <p>This page has no media.</p>
      )}
    </div>
  );
}
