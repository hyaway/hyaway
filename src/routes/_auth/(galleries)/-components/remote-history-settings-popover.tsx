import { ThumbnailGalleryDisplaySettingsContent } from "@/components/thumbnail-gallery/thumbnail-gallery-display-settings-popover";
import {
  VIEW_STATISTICS_LIMIT_SETTINGS_TITLE,
  ViewStatisticsLimitSettings,
} from "@/components/settings/view-statistics-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";
import { Separator } from "@/components/ui-primitives/separator";

export function RemoteHistorySettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>{VIEW_STATISTICS_LIMIT_SETTINGS_TITLE}</SettingsTitle>
      </SettingsHeader>
      <ViewStatisticsLimitSettings
        idPrefix="popover-"
        variant="remoteHistory"
      />

      <Separator className="my-4" />

      <ThumbnailGalleryDisplaySettingsContent />
    </SettingsPopover>
  );
}
