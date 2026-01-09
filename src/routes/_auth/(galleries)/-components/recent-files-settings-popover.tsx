import { ThumbnailGalleryDisplaySettingsContent } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import {
  RECENT_FILES_SETTINGS_TITLE,
  RecentFilesSettings,
} from "@/components/settings/recent-files-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function RecentFilesSettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>{RECENT_FILES_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <RecentFilesSettings idPrefix="popover-" />
      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
