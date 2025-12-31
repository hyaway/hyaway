import { ThumbnailGalleryDisplaySettingsContent } from "@/components/image-grid/thumbnail-gallery-display-settings-popover";
import {
  RANDOM_INBOX_SETTINGS_TITLE,
  RandomInboxSettings,
} from "@/components/settings/random-inbox-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";
import { Separator } from "@/components/ui-primitives/separator";

export function RandomInboxSettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <ThumbnailGalleryDisplaySettingsContent />

      <Separator className="my-4" />

      <SettingsHeader>
        <SettingsTitle>{RANDOM_INBOX_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <RandomInboxSettings idPrefix="popover-" min={10} step={10} />
    </SettingsPopover>
  );
}
