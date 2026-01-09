import { ThumbnailGalleryDisplaySettingsContent } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import {
  HistorySettings,
  WATCH_HISTORY_SETTINGS_TITLE,
} from "@/components/settings/history-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";

export function HistorySettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>{WATCH_HISTORY_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <HistorySettings idPrefix="popover-" />
      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
