import { createFileRoute } from "@tanstack/react-router";
import { IconTrashX } from "@tabler/icons-react";
import { EmptyState } from "@/components/page/empty-state";
import { PageFloatingBar } from "@/components/page/page-floating-bar";
import { PageHeading } from "@/components/page/page-heading";
import { RecentlyViewedSettingsPopover } from "@/components/settings/recently-viewed-settings-popover";
import { ImageGrid } from "@/components/image-grid/image-grid";
import {
  useRecentlyViewedActions,
  useRecentlyViewedEnabled,
  useRecentlyViewedFileIds,
} from "@/lib/recently-viewed-store";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";

export const Route = createFileRoute("/_auth/recently-viewed")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Recently viewed",
  }),
});

function RouteComponent() {
  const fileIds = useRecentlyViewedFileIds();
  const enabled = useRecentlyViewedEnabled();
  const { clearHistory } = useRecentlyViewedActions();

  const clearButton = (
    <BottomNavButton
      label="Clear"
      icon={<IconTrashX className="size-6" />}
      onClick={clearHistory}
      disabled={fileIds.length === 0}
    />
  );

  const emptyMessage = enabled
    ? "No recently viewed files. Open a file to add it to your history."
    : "No recently viewed files. Tracking is disabled — enable it in settings to start recording your history.";

  return (
    <>
      <div className="pb-16">
        <PageHeading
          title={`Recently viewed (${fileIds.length} ${fileIds.length === 1 ? "file" : "files"})`}
        />
        {fileIds.length > 0 ? (
          <ImageGrid fileIds={fileIds} />
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
      <PageFloatingBar
        leftContent={clearButton}
        rightContent={<RecentlyViewedSettingsPopover />}
      />
    </>
  );
}
