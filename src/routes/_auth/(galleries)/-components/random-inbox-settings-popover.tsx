import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import {
  SettingsGroup,
  SliderField,
} from "@/components/settings/setting-fields";
import { ImageGallerySettingsContent } from "@/components/image-grid/image-gallery-settings-popover";
import { SettingsPopover } from "@/components/settings/settings-popover";
import { Separator } from "@/components/ui-primitives/separator";
import {
  MAX_RANDOM_INBOX_LIMIT,
  useRandomInboxLimit,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function RandomInboxSettingsPopover() {
  const randomInboxLimit = useRandomInboxLimit();
  const { setRandomInboxLimit } = useUxSettingsActions();

  return (
    <SettingsPopover label="Settings">
      <ImageGallerySettingsContent />

      <Separator className="my-4" />

      <SettingsHeader>
        <SettingsTitle>Random inbox</SettingsTitle>
      </SettingsHeader>
      <SettingsGroup>
        <SliderField
          id="random-inbox-limit-popover-slider"
          label="Limit returned files to"
          value={randomInboxLimit}
          min={10}
          max={MAX_RANDOM_INBOX_LIMIT}
          step={10}
          onValueChange={setRandomInboxLimit}
          commitOnRelease
        />
      </SettingsGroup>
    </SettingsPopover>
  );
}
