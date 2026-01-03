import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { IconArrowsShuffle } from "@tabler/icons-react";
import { RandomInboxSettingsPopover } from "./-components/random-inbox-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import { useRandomInboxFilesQuery } from "@/integrations/hydrus-api/queries/search";

export const Route = createFileRoute("/_auth/(galleries)/random-inbox/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading, isError, error } = useRandomInboxFilesQuery();
  const queryClient = useQueryClient();

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
        <PageLoading title="Random inbox" />
        <PageFloatingFooter
          leftContent={shuffleButton}
          rightContent={<RandomInboxSettingsPopover />}
        />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <>
          <PageHeading title="Random inbox" />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching random inbox files."
          />
        </>
        <PageFloatingFooter
          leftContent={shuffleButton}
          rightContent={<RandomInboxSettingsPopover />}
        />
      </>
    );
  }

  return (
    <>
      <>
        <PageHeading
          title={`Random inbox (${data?.file_ids?.length ?? 0} files)`}
        />
        {data?.file_ids && data.file_ids.length > 0 ? (
          <ThumbnailGallery fileIds={data.file_ids} getFileLink={getFileLink} />
        ) : (
          <EmptyState message="No inbox files found." />
        )}
      </>
      <PageFloatingFooter
        leftContent={shuffleButton}
        rightContent={<RandomInboxSettingsPopover />}
      />
    </>
  );
}
