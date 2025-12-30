import { createFileRoute } from "@tanstack/react-router";
import { IconTrashX } from "@tabler/icons-react";
import { EmptyState } from "@/components/page/empty-state";
import { PageFloatingBar } from "@/components/page/page-floating-bar";
import { PageHeading } from "@/components/page/page-heading";
import { HistorySettingsPopover } from "@/components/settings/history-settings-popover";
import { ImageGrid } from "@/components/image-grid/image-grid";
import {
  useHistoryActions,
  useHistoryEnabled,
  useHistoryFileIds,
} from "@/lib/history-store";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";

export const Route = createFileRoute("/_auth/history")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "History",
  }),
});

function RouteComponent() {
  const fileIds = useHistoryFileIds();
  const enabled = useHistoryEnabled();
  const { clearHistory } = useHistoryActions();

  const clearButton = (
    <BottomNavButton
      label="Clear"
      icon={<IconTrashX className="size-6" />}
      onClick={clearHistory}
      disabled={fileIds.length === 0}
    />
  );

  const emptyMessage = enabled
    ? "No files in history. Open a file to add it to your history."
    : "No files in history. Tracking is disabled — enable it in settings to start recording your history.";

  return (
    <>
      <div className="pb-16">
        <PageHeading
          title={`History (${fileIds.length} ${fileIds.length === 1 ? "file" : "files"})`}
        />
        {fileIds.length > 0 ? (
          <ImageGrid fileIds={fileIds} />
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
      <PageFloatingBar
        leftContent={clearButton}
        rightContent={<HistorySettingsPopover />}
      />
    </>
  );
}
