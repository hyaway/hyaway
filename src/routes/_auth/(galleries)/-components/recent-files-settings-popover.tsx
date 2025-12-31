import { ThumbnailGalleryDisplaySettingsContent } from "@/components/image-grid/thumbnail-gallery-display-settings-popover";
import { RecentFilesSettings } from "@/components/settings/recent-files-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";
import { Separator } from "@/components/ui-primitives/separator";

export function RecentFilesSettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <ThumbnailGalleryDisplaySettingsContent />

      <Separator className="my-4" />

      <SettingsHeader>
        <SettingsTitle>Recent files</SettingsTitle>
      </SettingsHeader>
      <RecentFilesSettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
