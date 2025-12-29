import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui-primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import { Separator } from "@/components/ui-primitives/separator";
import {
  SettingsGroup,
  SliderField,
} from "@/components/settings/setting-fields";
import { ImageGallerySettingsContent } from "@/components/settings/image-gallery-settings-popover";
import {
  MAX_RANDOM_INBOX_LIMIT,
  useRandomInboxLimit,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function RandomInboxSettingsPopover() {
  const randomInboxLimit = useRandomInboxLimit();
  const { setRandomInboxLimit } = useUxSettingsActions();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon">
            <AdjustmentsHorizontalIcon />
            <span className="sr-only">Settings</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
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
      </PopoverContent>
    </Popover>
  );
}
