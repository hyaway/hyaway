import { ImageGallerySettingsContent } from "@/components/image-grid/image-gallery-settings-popover";
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
      <ImageGallerySettingsContent />

      <Separator className="my-4" />

      <SettingsHeader>
        <SettingsTitle>Recency</SettingsTitle>
      </SettingsHeader>
      <RecentFilesSettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
