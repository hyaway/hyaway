import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { Separator } from "@/components/ui-primitives/separator";
import {
  SettingsGroup,
  SliderField,
  SwitchField,
} from "@/components/settings/setting-fields";
import { ImageGallerySettingsContent } from "@/components/settings/image-gallery-settings-popover";
import { SettingsPopover } from "@/components/settings/settings-popover";
import {
  MAX_RECENTLY_VIEWED_LIMIT,
  useRecentlyViewedActions,
  useRecentlyViewedEnabled,
  useRecentlyViewedLimit,
} from "@/lib/recently-viewed-store";

export function RecentlyViewedSettingsPopover() {
  const enabled = useRecentlyViewedEnabled();
  const limit = useRecentlyViewedLimit();
  const { setEnabled, setLimit } = useRecentlyViewedActions();

  return (
    <SettingsPopover label="Settings">
      <ImageGallerySettingsContent />

      <Separator className="my-4" />

      <SettingsHeader>
        <SettingsTitle>Recently viewed</SettingsTitle>
      </SettingsHeader>
      <SettingsGroup>
        <SwitchField
          id="recently-viewed-enabled-popover-switch"
          label="Keep track of recently viewed files"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        <SliderField
          id="recently-viewed-limit-popover-slider"
          label="Maximum entries to keep"
          value={limit}
          min={10}
          max={MAX_RECENTLY_VIEWED_LIMIT}
          step={10}
          onValueChange={setLimit}
          commitOnRelease
        />
      </SettingsGroup>
    </SettingsPopover>
  );
}
