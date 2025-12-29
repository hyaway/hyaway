import {
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui-primitives/popover";
import { Separator } from "@/components/ui-primitives/separator";
import {
  SettingsGroup,
  SliderField,
} from "@/components/settings/setting-fields";
import { ImageGallerySettingsContent } from "@/components/settings/image-gallery-settings-popover";
import { SettingsPopover } from "@/components/settings/settings-popover";
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

      <PopoverHeader>
        <PopoverTitle>Random inbox settings</PopoverTitle>
      </PopoverHeader>
      <SettingsGroup>
        <SliderField
          id="random-inbox-limit-popover-slider"
          label="Limit returned files to"
          value={randomInboxLimit}
          min={100}
          max={MAX_RANDOM_INBOX_LIMIT}
          step={100}
          onValueChange={setRandomInboxLimit}
          commitOnRelease
        />
      </SettingsGroup>
    </SettingsPopover>
  );
}
