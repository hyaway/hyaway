// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingsCardTitle } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import { useFileViewerSettingsActions } from "@/stores/file-viewer-settings-store";
import { useGallerySettingsActions } from "@/stores/gallery-settings-store";
import { usePagesSettingsActions } from "@/stores/pages-settings-store";
import { useRatingsSettingsActions } from "@/stores/ratings-settings-store";
import { useReviewQueueActions } from "@/stores/review-queue-store";
import { useTagsSettingsActions } from "@/stores/tags-settings-store";

export function ResetAllAppearanceSettingsCard() {
  const { reset: resetGallery } = useGallerySettingsActions();
  const { reset: resetFileViewer } = useFileViewerSettingsActions();
  const { reset: resetPages } = usePagesSettingsActions();
  const { reset: resetRatings } = useRatingsSettingsActions();
  const { reset: resetTags } = useTagsSettingsActions();
  const { resetControlsSettings: resetReviewControls } =
    useReviewQueueActions();

  const handleResetAll = () => {
    resetGallery();
    resetFileViewer();
    resetPages();
    resetRatings();
    resetTags();
    resetReviewControls();
  };

  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>Reset all appearance settings</SettingsCardTitle>
        <CardDescription>
          Reset all settings on this page to their default values. This does not
          affect your theme preference.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button variant="destructive" onClick={handleResetAll}>
          Reset appearance settings
        </Button>
      </CardContent>
    </Card>
  );
}
