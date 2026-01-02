import { ThumbnailGalleryDisplaySettingsContent } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import {
  WATCH_HISTORY_SETTINGS_TITLE,
  HistorySettings,
} from "@/components/settings/history-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";
import { Separator } from "@/components/ui-primitives/separator";

export function HistorySettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <ThumbnailGalleryDisplaySettingsContent />

      <Separator className="my-4" />

      <SettingsHeader>
        <SettingsTitle>{WATCH_HISTORY_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <HistorySettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
