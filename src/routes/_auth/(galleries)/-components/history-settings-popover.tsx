import { ImageGallerySettingsContent } from "@/components/image-grid/image-gallery-settings-popover";
import { HistorySettings } from "@/components/settings/history-settings";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SettingsPopover } from "@/components/settings/settings-popover";
import { Separator } from "@/components/ui-primitives/separator";

export function HistorySettingsPopover() {
  return (
    <SettingsPopover label="Settings">
      <ImageGallerySettingsContent />

      <Separator className="my-4" />

      <SettingsHeader>
        <SettingsTitle>Watch history</SettingsTitle>
      </SettingsHeader>
      <HistorySettings idPrefix="popover-" />
    </SettingsPopover>
  );
}
