// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute } from "@tanstack/react-router";
import { FileViewerSettingsCard } from "./-components/file-viewer-settings-card";
import { ThumbnailGalleryDisplaySettingsCard } from "./-components/thumbnail-gallery-display-settings-card";
import { PagesDisplaySettingsCard } from "./-components/pages-display-settings-card";
import { ThemeCard } from "./-components/theme-card";
import { ReviewControlsSettingsCard } from "./-components/review-controls-settings-card";
import { ReviewRatingsSettingsCard } from "./-components/review-ratings-settings-card";
import { ResetAllAppearanceSettingsCard } from "./-components/reset-all-appearance-settings-card";
import { Heading } from "@/components/ui-primitives/heading";

export const Route = createFileRoute("/(settings)/settings/appearance")({
  component: SettingsAppearanceComponent,
  beforeLoad: () => ({
    getTitle: () => "Appearance settings",
    useHistoryBack: true,
  }),
});

function SettingsAppearanceComponent() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Heading level={2} className="sr-only">
        Appearance Settings
      </Heading>
      <ThemeCard />
      <PagesDisplaySettingsCard />
      <ThumbnailGalleryDisplaySettingsCard />
      <FileViewerSettingsCard />
      <ReviewControlsSettingsCard />
      <ReviewRatingsSettingsCard />
      <ResetAllAppearanceSettingsCard />
    </div>
  );
}
