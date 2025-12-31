import { createFileRoute } from "@tanstack/react-router";
import { FileViewerCard } from "./-components/file-viewer-card";
import { ImageGalleryCard } from "./-components/image-gallery-card";
import { PagesCard } from "./-components/pages-card";
import { RandomInboxCard } from "./-components/random-inbox-card";
import { RecentFilesCard } from "./-components/recent-files-card";
import { HistoryCard } from "./-components/history-card";
import { TagsSortCard } from "./-components/tags-sort-card";
import { ThemeCard } from "./-components/theme-card";
import { Heading } from "@/components/ui-primitives/heading";

export const Route = createFileRoute("/(settings)/settings/ux")({
  component: SettingsUXComponent,
  beforeLoad: () => ({
    getTitle: () => "UX settings",
  }),
});

function SettingsUXComponent() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Heading level={2} className="sr-only">
        UX Settings
      </Heading>
      <ThemeCard />
      <FileViewerCard />
      <ImageGalleryCard />
      <TagsSortCard />
      <PagesCard />
      <RecentFilesCard />
      <HistoryCard />
      <RandomInboxCard />
    </div>
  );
}
