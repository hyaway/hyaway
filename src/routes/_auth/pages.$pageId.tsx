import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageError } from "@/components/page/page-error";
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
import { Button } from "@/components/ui-primitives/button";
import {
  useFocusPageMutation,
  useGetPageInfoQuery,
  useRefreshPageMutation,
} from "@/integrations/hydrus-api/queries/manage-pages";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { Separator } from "@/components/ui-primitives/separator";

export const Route = createFileRoute("/_auth/pages/$pageId")({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `${params.pageId.slice(0, 8)}...`,
  }),
});

function RouteComponent() {
  const { pageId } = Route.useParams();
  const { data, isLoading, isError, error } = useGetPageInfoQuery(pageId, true);
  const refreshPageMutation = useRefreshPageMutation();
  const focusPageMutation = useFocusPageMutation();
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <PageLoading title={`Page: ${pageId.slice(0, 8)}...`} buttonCount={3} />
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeading title={`Page: ${pageId.slice(0, 8)}...`} />
        <PageError
          error={error}
          fallbackMessage="An unknown error occurred while fetching pages."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeading title={`Page: ${data?.page_info.name}`} />
      <div className="flex gap-2">
        <Button
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ["getPageInfo", pageId],
            })
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
