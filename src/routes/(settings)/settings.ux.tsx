import { createFileRoute } from "@tanstack/react-router";
import { FileViewerSettingsCard } from "./-components/file-viewer-settings-card";
import { ThumbnailGalleryDisplaySettingsCard } from "./-components/thumbnail-gallery-display-settings-card";
import { PagesDisplaySettingsCard } from "./-components/pages-display-settings-card";
import { RandomInboxSettingsCard } from "./-components/random-inbox-settings-card";
import { RecentFilesSettingsCard } from "./-components/recent-files-settings-card";
import { HistorySettingsCard } from "./-components/history-settings-card";
import { TagsSortCard } from "./-components/tags-sort-card";
import { ThemeCard } from "./-components/theme-card";
import { ResetAllUxSettingsCard } from "./-components/reset-all-ux-settings-card";
import { Heading } from "@/components/ui-primitives/heading";

export const Route = createFileRoute("/(settings)/settings/ux")({
  component: SettingsUXComponent,
  beforeLoad: () => ({
    getTitle: () => "UX settings",
    useHistoryBack: true,
  }),
});

function SettingsUXComponent() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Heading level={2} className="sr-only">
        UX Settings
      </Heading>
      <ThemeCard />
      <FileViewerSettingsCard />
      <ThumbnailGalleryDisplaySettingsCard />
      <TagsSortCard />
      <PagesDisplaySettingsCard />
      <RecentFilesSettingsCard />
      <HistorySettingsCard />
      <RandomInboxSettingsCard />
      <ResetAllUxSettingsCard />
    </div>
  );
}
