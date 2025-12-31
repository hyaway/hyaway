import { createFileRoute } from "@tanstack/react-router";
import { IconTrashX } from "@tabler/icons-react";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageFloatingBar } from "@/components/page-shell/page-floating-bar";
import { PageHeading } from "@/components/page-shell/page-heading";
import { HistorySettingsPopover } from "./-components/history-settings-popover";
import { ImageGrid } from "@/components/image-grid/image-grid";
import {
  useHistoryActions,
  useHistoryEnabled,
  useHistoryFileIds,
} from "@/lib/history-store";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import { Button } from "@/components/ui-primitives/button";

export const Route = createFileRoute("/_auth/(galleries)/history")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Watch history",
  }),
});

function RouteComponent() {
  const fileIds = useHistoryFileIds();
  const enabled = useHistoryEnabled();
  const { clearHistory, setEnabled } = useHistoryActions();

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
        {fileIds.length > 0 ? <ImageGrid fileIds={fileIds} /> : emptyContent}
      </div>
      <PageFloatingBar
        leftContent={clearButton}
        rightContent={<HistorySettingsPopover />}
      />
    </>
  );
}
