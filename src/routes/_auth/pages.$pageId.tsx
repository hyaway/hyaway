import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageError } from "@/components/page/page-error";
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
import { RefetchButton } from "@/components/refetch-button";
import { ImageGallerySettingsPopover } from "@/components/settings/image-gallery-settings-popover";
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
  const { data, isLoading, isFetching, isError, error } = useGetPageInfoQuery(
    pageId,
    true,
  );
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
      <PageHeading
        title={`Page: ${data?.page_info.name} (${data?.page_info.media.num_files ?? 0} files)`}
      />
      <div className="flex gap-2">
        <RefetchButton
          isFetching={isFetching}
          onRefetch={() =>
            queryClient.invalidateQueries({
              queryKey: ["getPageInfo", pageId],
            })
          }
        />
        <Button onClick={() => refreshPageMutation.mutate(pageId)}>
          Refresh remote
        </Button>
        <Button onClick={() => focusPageMutation.mutate(pageId)}>
          Focus remote
        </Button>
        <div className="ml-auto">
          <ImageGallerySettingsPopover />
        </div>
      </div>
      <Separator className="my-2" />

      {data?.page_info.media ? (
        <ImageGrid fileIds={data.page_info.media.hash_ids} />
      ) : (
        <p>This page has no media.</p>
      )}
    </div>
  );
}
