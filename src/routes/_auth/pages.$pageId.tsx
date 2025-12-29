import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/solid";
import { PageError } from "@/components/page/page-error";
import {
  PageFloatingBar,
  type FloatingBarAction,
} from "@/components/page/page-floating-bar";
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
import { RefetchButton } from "@/components/refetch-button";
import { ImageGallerySettingsPopover } from "@/components/settings/image-gallery-settings-popover";
import {
  useFocusPageMutation,
  useGetPageInfoQuery,
  useRefreshPageMutation,
} from "@/integrations/hydrus-api/queries/manage-pages";
import { ImageGrid } from "@/components/image-grid/image-grid";

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

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: ["getPageInfo", pageId],
        })
      }
    />
  );

  const overflowActions: Array<FloatingBarAction> = [
    {
      id: "refresh-remote",
      label: "Refresh remote",
      icon: ArrowPathIcon,
      onClick: () => refreshPageMutation.mutate(pageId),
      isPending: refreshPageMutation.isPending,
      overflowOnly: true,
    },
    {
      id: "focus-remote",
      label: "Focus remote",
      icon: ArrowTopRightOnSquareIcon,
      onClick: () => focusPageMutation.mutate(pageId),
      isPending: focusPageMutation.isPending,
      overflowOnly: true,
    },
  ];

  if (isLoading) {
    return (
      <>
        <PageLoading title={`Page: ${pageId.slice(0, 8)}...`} />
        <PageFloatingBar
          leftContent={refetchButton}
          actions={overflowActions}
          rightContent={<ImageGallerySettingsPopover size="xl" />}
        />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="pb-16">
          <PageHeading title={`Page: ${pageId.slice(0, 8)}...`} />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching pages."
          />
        </div>
        <PageFloatingBar
          leftContent={refetchButton}
          actions={overflowActions}
          rightContent={<ImageGallerySettingsPopover size="xl" />}
        />
      </>
    );
  }

  return (
    <>
      <div className="pb-16">
        <PageHeading
          title={`Page: ${data?.page_info.name} (${data?.page_info.media.num_files ?? 0} files)`}
        />
        {data?.page_info.media ? (
          <ImageGrid fileIds={data.page_info.media.hash_ids} />
        ) : (
          <p>This page has no media.</p>
        )}
      </div>
      <PageFloatingBar
        leftContent={refetchButton}
        actions={overflowActions}
        rightContent={<ImageGallerySettingsPopover size="xl" />}
      />
    </>
  );
}
