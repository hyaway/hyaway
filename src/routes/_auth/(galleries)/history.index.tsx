import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { useCallback } from "react";
import { IconTrashX } from "@tabler/icons-react";
import { HistorySettingsPopover } from "./-components/history-settings-popover";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeading } from "@/components/page-shell/page-heading";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import { Button } from "@/components/ui-primitives/button";
import { useHistory, useHistoryFileIds } from "@/lib/history-store";

export const Route = createFileRoute("/_auth/(galleries)/history/")({
  component: RouteComponent,
});

function RouteComponent() {
  const fileIds = useHistoryFileIds();
  const enabled = useHistory.enabled();
  const { clearHistory, setEnabled } = useHistory.actions();

  // Link builder for contextual navigation
  const getFileLink: FileLinkBuilder = useCallback(
    (fileId) =>
      linkOptions({
        to: "/history/$fileId",
        params: { fileId: String(fileId) },
      }),
    [],
  );

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
      <div className="pb-16">
        <PageHeading
          title={`Watch history (${fileIds.length} ${fileIds.length === 1 ? "file" : "files"})`}
        />
        {fileIds.length > 0 ? (
          <ThumbnailGallery fileIds={fileIds} getFileLink={getFileLink} />
        ) : (
          emptyContent
        )}
      </div>
      <PageFloatingFooter
        leftContent={clearButton}
        rightContent={<HistorySettingsPopover />}
      />
    </>
  );
}
