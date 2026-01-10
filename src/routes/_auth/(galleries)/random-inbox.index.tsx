import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { IconArrowsShuffle } from "@tabler/icons-react";
import { RandomInboxSettingsPopover } from "./-components/random-inbox-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import { useReviewActions } from "@/hooks/use-review-actions";
import { useRandomInboxFilesQuery } from "@/integrations/hydrus-api/queries/search";

export const Route = createFileRoute("/_auth/(galleries)/random-inbox/")({
  component: RouteComponent,
});

const PAGE_TITLE = "Random inbox";

function RouteComponent() {
  const { data, isLoading, isError, error } = useRandomInboxFilesQuery();
  const queryClient = useQueryClient();

  const fileIds = data?.file_ids ?? [];
  const hasFiles = fileIds.length > 0;
  const reviewActions = useReviewActions({ fileIds });

  // Link builder for contextual navigation
  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/random-inbox/$fileId",
      params: { fileId: String(fileId) },
    });

  const handleShuffle = () => {
    queryClient.resetQueries({
      queryKey: ["searchFiles", "randomInbox"],
    });
  };

  const shuffleButton = (
    <BottomNavButton
      key="shuffle"
      label="Shuffle"
      icon={<IconArrowsShuffle className="size-6" />}
      onClick={handleShuffle}
      isLoading={isLoading}
      disabled={isError}
    />
  );

  if (isLoading) {
    return (
      <>
        <PageLoading title={PAGE_TITLE} />
        <PageHeaderActions>
          <RandomInboxSettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter leftContent={shuffleButton} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <>
          <PageHeading title={PAGE_TITLE} />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching random inbox files."
          />
        </>
        <PageHeaderActions>
          <RandomInboxSettingsPopover />
        </PageHeaderActions>
        <PageFloatingFooter leftContent={shuffleButton} />
      </>
    );
  }

  return (
    <>
      <>
        <PageHeading
          title={`Random inbox (${data?.file_ids?.length ?? 0} files)`}
        />
        {hasFiles ? (
          <ThumbnailGallery fileIds={fileIds} getFileLink={getFileLink} />
        ) : (
          <EmptyState message="No inbox files found." />
        )}
      </>
      <PageHeaderActions>
        <RandomInboxSettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter leftContent={shuffleButton} actions={reviewActions} />
    </>
  );
}
