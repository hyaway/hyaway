// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  FILE_VIEWER_SETTINGS_TITLE,
  FileViewerSettings,
} from "@/components/settings/file-viewer-settings";
import {
  REVIEW_CONTROLS_SETTINGS_TITLE,
  ReviewControlsSettings,
} from "@/components/settings/review-controls-settings";
import {
  REVIEW_QUEUE_SETTINGS_TITLE,
  ReviewQueueSettings,
} from "@/components/settings/review-queue-settings";
import {
  REVIEW_RATINGS_SETTINGS_TITLE,
  ReviewRatingsSettings,
} from "@/components/settings/review-ratings-settings";
import { SettingsPopover } from "@/components/settings/settings-popover";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { Separator } from "@/components/ui-primitives/separator";
import { useHasRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";

export function ReviewSettingsPopover() {
  const hasRatingServices = useHasRatingServices();

  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>{REVIEW_QUEUE_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <ReviewQueueSettings idPrefix="popover-" />

      <Separator className="my-2" />

      <SettingsHeader>
        <SettingsTitle>{FILE_VIEWER_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <FileViewerSettings
        idPrefix="popover-"
        openMultiple
        defaultSections="all"
        hideExpandedSettings
      />
      {hasRatingServices && (
        <>
          <Separator className="my-2" />

          <SettingsHeader>
            <SettingsTitle>{REVIEW_RATINGS_SETTINGS_TITLE}</SettingsTitle>
          </SettingsHeader>
          <ReviewRatingsSettings idPrefix="popover-" />
        </>
      )}
      <Separator className="my-2" />
      <SettingsHeader>
        <SettingsTitle>{REVIEW_CONTROLS_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <ReviewControlsSettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
