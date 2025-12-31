import { SettingsHeader, SettingsTitle } from "./settings-ui";
import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import { ImageGallerySettingsContent } from "./image-gallery-settings-popover";
import { SettingsPopover } from "./settings-popover";
import { Separator } from "@/components/ui-primitives/separator";
import {
  MAX_HISTORY_LIMIT,
  useHistoryActions,
  useHistoryEnabled,
  useHistoryLimit,
} from "@/lib/history-store";

export function HistorySettingsPopover() {
  const enabled = useHistoryEnabled();
  const limit = useHistoryLimit();
  const { setEnabled, setLimit } = useHistoryActions();

  return (
    <SettingsPopover label="Settings">
      <ImageGallerySettingsContent />

      <Separator className="my-4" />

      <SettingsHeader>
        <SettingsTitle>Watch history</SettingsTitle>
      </SettingsHeader>
      <SettingsGroup>
        <SwitchField
          id="history-enabled-popover-switch"
          label="Record new views"
          description="Existing history is kept when disabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        <SliderField
          id="history-limit-popover-slider"
          label="Maximum entries to keep"
          value={limit}
          min={10}
          max={MAX_HISTORY_LIMIT}
          step={10}
          onValueChange={setLimit}
          commitOnRelease
        />
      </SettingsGroup>
    </SettingsPopover>
  );
}
