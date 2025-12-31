import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { IconArrowsShuffle } from "@tabler/icons-react";
import { PageError } from "@/components/page-shell/page-error";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageFloatingBar } from "@/components/page-shell/page-floating-bar";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RandomInboxSettingsPopover } from "@/routes/(settings)/-components/random-inbox-settings-popover";
import { useRandomInboxFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";

export const Route = createFileRoute("/_auth/(galleries)/random-inbox")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Random inbox",
  }),
});

function RouteComponent() {
  const { data, isLoading, isError, error } = useRandomInboxFilesQuery();
  const queryClient = useQueryClient();

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
        <PageFloatingBar
          leftContent={shuffleButton}
          rightContent={<RandomInboxSettingsPopover />}
        />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="pb-16">
          <PageHeading title="Random inbox" />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching random inbox files."
          />
        </div>
        <PageFloatingBar
          leftContent={shuffleButton}
          rightContent={<RandomInboxSettingsPopover />}
        />
      </>
    );
  }

  return (
    <>
      <div className="pb-16">
        <PageHeading
          title={`Random inbox (${data?.file_ids?.length ?? 0} files)`}
        />
        {data?.file_ids && data.file_ids.length > 0 ? (
          <ImageGrid fileIds={data.file_ids} />
        ) : (
          <EmptyState message="No inbox files found." />
        )}
      </div>
      <PageFloatingBar
        leftContent={shuffleButton}
        rightContent={<RandomInboxSettingsPopover />}
      />
    </>
  );
}
