import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageError } from "@/components/page-error";
import { Button } from "@/components/ui-primitives/button";
import { Heading } from "@/components/ui-primitives/heading";
import {
  useFocusPageMutation,
  useGetPageInfoQuery,
  useRefreshPageMutation,
} from "@/integrations/hydrus-api/queries/manage-pages";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { ImageGridSkeleton } from "@/components/image-grid/image-grid-skeleton";
import { Separator } from "@/components/ui-primitives/separator";
import { Skeleton } from "@/components/ui-primitives/skeleton";

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
      <div>
        <Heading level={1}>Page: {pageId.slice(0, 8)}...</Heading>
        <Separator className="my-2" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-4xl" />
          <Skeleton className="h-9 w-32 rounded-4xl" />
          <Skeleton className="h-9 w-16 rounded-4xl" />
        </div>
        <Separator className="my-2" />
        <ImageGridSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <Heading level={1}>Page: {pageId.slice(0, 8)}...</Heading>
        <Separator className="my-2" />
        <PageError
          error={error}
          fallbackMessage="An unknown error occurred while fetching pages."
        />
      </div>
    );
  }

  return (
    <div>
      <Heading level={1}>Page: {data?.page_info.name}</Heading>
      <Separator className="my-2" />
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
