// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE,
  ThumbnailGalleryDisplaySettings,
} from "@/components/settings/thumbnail-gallery-display-settings";
import {
  RATINGS_SETTINGS_TITLE,
  RatingsSettings,
} from "@/components/settings/ratings-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";
import { Separator } from "@/components/ui-primitives/separator";
import { useHasRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";

export function ThumbnailGalleryDisplaySettingsContent() {
  const hasRatingServices = useHasRatingServices();

  return (
    <>
      <SettingsHeader className="mb-0">
        <SettingsTitle>
          {THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE}
        </SettingsTitle>
      </SettingsHeader>
      <ThumbnailGalleryDisplaySettings idPrefix="popover-" defaultOpen={true} />
      {hasRatingServices && (
        <>
          <Separator className="my-2" />
          <SettingsHeader>
            <SettingsTitle>{RATINGS_SETTINGS_TITLE}</SettingsTitle>
          </SettingsHeader>
          <RatingsSettings idPrefix="popover-" showReviewSetting={false} />
        </>
      )}
    </>
  );
}

export function ThumbnailGalleryDisplaySettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
