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
  MAX_RETENTION_HOURS,
  useRecentlyViewedActions,
  useRecentlyViewedEnabled,
  useRecentlyViewedLimit,
  useRecentlyViewedRetentionHours,
} from "@/lib/recently-viewed-store";
import { formatHoursCompact } from "@/lib/format-utils";

export function RecentlyViewedSettingsPopover() {
  const enabled = useRecentlyViewedEnabled();
  const limit = useRecentlyViewedLimit();
  const retentionHours = useRecentlyViewedRetentionHours();
  const { setEnabled, setLimit, setRetentionHours } =
    useRecentlyViewedActions();

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
        <SliderField
          id="recently-viewed-retention-popover-slider"
          label="Keep entries for"
          value={retentionHours}
          min={1}
          max={MAX_RETENTION_HOURS}
          step={1}
          onValueChange={setRetentionHours}
          commitOnRelease
          formatValue={formatHoursCompact}
        />
      </SettingsGroup>
    </SettingsPopover>
  );
}
