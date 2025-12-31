import {
  THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE,
  ThumbnailGalleryDisplaySettings,
} from "@/components/settings/thumbnail-gallery-display-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function ThumbnailGalleryDisplaySettingsContent() {
  return (
    <>
      <SettingsHeader>
        <SettingsTitle>
          {THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE}
        </SettingsTitle>
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
