import { createFileRoute } from "@tanstack/react-router";
import { Heading } from "@/components/ui-primitives/heading";
import { ThemeCard } from "@/components/settings/theme-card";
import { ImageGalleryCard } from "@/components/settings/image-gallery-card";
import { PagesCard } from "@/components/settings/pages-card";
import { TagsSortCard } from "@/components/settings/tags-sort-card";

export const Route = createFileRoute("/settings/ux")({
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
      <ImageGalleryCard />
      <PagesCard />
      <TagsSortCard />
    </div>
  );
}
