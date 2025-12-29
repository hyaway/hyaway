import {
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui-primitives/popover";
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
    <SettingsPopover label="Page settings">
      <PopoverHeader>
        <PopoverTitle>Pages settings</PopoverTitle>
      </PopoverHeader>
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
