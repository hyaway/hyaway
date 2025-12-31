import { ImageGallerySettings } from "@/components/settings/image-gallery-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function ImageGallerySettingsContent() {
  return (
    <>
      <SettingsHeader>
        <SettingsTitle>Gallery view</SettingsTitle>
      </SettingsHeader>
      <ImageGallerySettings idPrefix="popover-" />
    </>
  );
}

export function ImageGallerySettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <ImageGallerySettingsContent />
    </SettingsPopover>
  );
}
