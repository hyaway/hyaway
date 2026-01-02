import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import { MAX_PAGES_COLUMNS, useSettings } from "@/lib/settings-store";

export const PAGES_DISPLAY_SETTINGS_TITLE = "Pages display";

export interface PagesDisplaySettingsProps {
  idPrefix?: string;
}

export function PagesDisplaySettings({
  idPrefix = "",
}: PagesDisplaySettingsProps) {
  const pagesMaxColumns = useSettings.pagesMaxColumns();
  const pagesShowScrollBadge = useSettings.pagesShowScrollBadge();
  const { setPagesMaxColumns, setPagesShowScrollBadge } = useSettings.actions();

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}pages-columns-slider`}
        label="Maximum columns"
        value={pagesMaxColumns}
        min={3}
        max={MAX_PAGES_COLUMNS}
        step={1}
        onValueChange={setPagesMaxColumns}
      />
      <SwitchField
        id={`${idPrefix}show-scroll-badge-switch`}
        label="Show scroll position badge"
        checked={pagesShowScrollBadge}
        onCheckedChange={setPagesShowScrollBadge}
      />
    </SettingsGroup>
  );
}
