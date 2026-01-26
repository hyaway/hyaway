// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  FILE_VIEWER_SETTINGS_TITLE,
  FileViewerSettings,
} from "@/components/settings/file-viewer-settings";
import {
  RATINGS_SETTINGS_TITLE,
  RatingsSettings,
} from "@/components/settings/ratings-settings";
import { SettingsPopover } from "@/components/settings/settings-popover";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { Separator } from "@/components/ui-primitives/separator";
import { useHasRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";

export interface FileViewerSettingsPopoverProps {
  className?: string;
  /** Mime type of the current file - determines which section opens by default */
  mimeType?: string;
  /** Hide the "open expanded" settings for both images and videos */
  hideExpandedSettings?: boolean;
}

export function FileViewerSettingsPopover({
  className,
  mimeType,
  hideExpandedSettings,
}: FileViewerSettingsPopoverProps = {}) {
  const hasRatingServices = useHasRatingServices();

  return (
    <SettingsPopover label="Settings" className={className}>
      <SettingsHeader>
        <SettingsTitle>{FILE_VIEWER_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <FileViewerSettings
        idPrefix="popover-"
        defaultSections="default"
        mimeType={mimeType}
        hideExpandedSettings={hideExpandedSettings}
      />
      {hasRatingServices && (
        <>
          <Separator className="my-2" />
          <SettingsHeader>
            <SettingsTitle>{RATINGS_SETTINGS_TITLE}</SettingsTitle>
          </SettingsHeader>
          <RatingsSettings idPrefix="popover-" showReviewSetting={false} />
        </>
      )}
    </SettingsPopover>
  );
}
