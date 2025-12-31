import { ThumbnailGalleryDisplaySettings } from "@/components/settings/thumbnail-gallery-display-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function ThumbnailGalleryDisplaySettingsContent() {
  return (
    <>
      <SettingsHeader>
        <SettingsTitle>Thumbnail gallery display</SettingsTitle>
      </SettingsHeader>
      <ThumbnailGalleryDisplaySettings idPrefix="popover-" />
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
