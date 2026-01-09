import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { IconTrashX } from "@tabler/icons-react";
import { HistorySettingsPopover } from "./-components/history-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import { Button } from "@/components/ui-primitives/button";
import {
  useWatchHistoryActions,
  useWatchHistoryEnabled,
  useWatchHistoryEntries,
  useWatchHistoryFileIds,
} from "@/stores/watch-history-store";

export const Route = createFileRoute("/_auth/(galleries)/history/")({
  component: RouteComponent,
});

function RouteComponent() {
  const fileIds = useWatchHistoryFileIds();
  const entries = useWatchHistoryEntries();
  const enabled = useWatchHistoryEnabled();
  const { clearHistory, setEnabled } = useWatchHistoryActions();

  // Link builder for contextual navigation
  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/history/$fileId",
      params: { fileId: String(fileId) },
    });

  const clearButton = (
    <BottomNavButton
      label="Clear"
      icon={<IconTrashX className="size-6" />}
      onClick={clearHistory}
      disabled={fileIds.length === 0}
    />
  );

  const emptyContent = enabled ? (
    <EmptyState message="No files in history. Open a file to add it to your history." />
  ) : (
    <EmptyState
      message="Watch history recording is disabled."
      action={
        <Button variant="default" onClick={() => setEnabled(true)}>
          Enable history
        </Button>
      }
    />
  );

  return (
    <>
      <>
        <PageHeading
          title={`Watch history (${fileIds.length} ${fileIds.length === 1 ? "file" : "files"})`}
        />
        {fileIds.length > 0 ? (
          <ThumbnailGalleryProvider
            infoMode="lastViewedLocal"
            localHistoryEntries={entries}
          >
            <ThumbnailGallery fileIds={fileIds} getFileLink={getFileLink} />
          </ThumbnailGalleryProvider>
        ) : (
          emptyContent
        )}
      </>
      <PageHeaderActions>
        <HistorySettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter leftContent={clearButton} />
    </>
  );
}
