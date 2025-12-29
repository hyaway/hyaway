import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import { SliderField } from "@/components/settings/setting-fields";
import { SettingsPopover } from "@/components/settings/settings-popover";
import {
  MAX_PAGES_COLUMNS,
  usePagesMaxColumns,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function PagesSettingsPopover() {
  const pagesMaxColumns = usePagesMaxColumns();
  const { setPagesMaxColumns } = useUxSettingsActions();

  return (
    <SettingsPopover label="Settings">
      <SettingsHeader>
        <SettingsTitle>Pages view</SettingsTitle>
      </SettingsHeader>
      <SliderField
        id="pages-columns-popover-slider"
        label="Maximum columns"
        value={pagesMaxColumns}
        min={3}
        max={MAX_PAGES_COLUMNS}
        step={1}
        onValueChange={setPagesMaxColumns}
      />
    </SettingsPopover>
  );
}
