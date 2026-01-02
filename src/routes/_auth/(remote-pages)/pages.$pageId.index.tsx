import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { IconFocusCentered, IconRefreshDot } from "@tabler/icons-react";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { ThumbnailGalleryDisplaySettingsPopover } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import {
  useFocusPageMutation,
  useGetPageInfoQuery,
  useRefreshPageMutation,
} from "@/integrations/hydrus-api/queries/manage-pages";

export const Route = createFileRoute("/_auth/(remote-pages)/pages/$pageId/")({
  component: RouteComponent,
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

  // Link builder for contextual navigation
  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/pages/$pageId/$fileId",
      params: { pageId, fileId: String(fileId) },
    });

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

  const overflowActions: Array<FloatingFooterAction> = [
    {
      id: "refresh-remote",
      label: "Refresh remote",
      icon: IconRefreshDot,
      onClick: () => refreshPageMutation.mutate(pageId),
      isPending: refreshPageMutation.isPending,
      overflowOnly: true,
    },
    {
      id: "focus-remote",
      label: "Focus remote",
      icon: IconFocusCentered,
      onClick: () => focusPageMutation.mutate(pageId),
      isPending: focusPageMutation.isPending,
      overflowOnly: true,
    },
  ];

  if (isLoading) {
    return (
      <>
        <PageLoading title={`Page: ${pageId.slice(0, 8)}...`} />
        <PageFloatingFooter
          leftContent={refetchButton}
          actions={overflowActions}
          rightContent={<ThumbnailGalleryDisplaySettingsPopover />}
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
        <PageFloatingFooter
          leftContent={refetchButton}
          actions={overflowActions}
          rightContent={<ThumbnailGalleryDisplaySettingsPopover />}
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
          <ThumbnailGallery
            fileIds={data.page_info.media.hash_ids}
            getFileLink={getFileLink}
          />
        ) : (
          <p>This page has no media.</p>
        )}
      </div>
      <PageFloatingFooter
        leftContent={refetchButton}
        actions={overflowActions}
        rightContent={<ThumbnailGalleryDisplaySettingsPopover />}
      />
    </>
  );
}
