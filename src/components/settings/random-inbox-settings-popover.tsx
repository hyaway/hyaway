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

export function RandomInboxSettingsPopover({
  size,
}: {
  size?: "default" | "xl";
} = {}) {
  const randomInboxLimit = useRandomInboxLimit();
  const { setRandomInboxLimit } = useUxSettingsActions();

  return (
    <SettingsPopover label="Settings" size={size}>
      <ImageGallerySettingsContent />

      <Separator className="my-4" />

      <PopoverHeader>
        <PopoverTitle>Random inbox</PopoverTitle>
      </PopoverHeader>
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
