import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_PAGES_COLUMNS,
  usePagesMaxColumns,
  usePagesSettingsActions,
  usePagesShowScrollBadge,
} from "@/stores/pages-settings-store";

export const PAGES_DISPLAY_SETTINGS_TITLE = "Pages display";

export interface PagesDisplaySettingsProps {
  idPrefix?: string;
}

export function PagesDisplaySettings({
  idPrefix = "",
}: PagesDisplaySettingsProps) {
  const pagesMaxColumns = usePagesMaxColumns();
  const pagesShowScrollBadge = usePagesShowScrollBadge();
  const { setMaxColumns, setShowScrollBadge } = usePagesSettingsActions();

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}pages-columns-slider`}
        label="Max columns"
        value={pagesMaxColumns}
        min={3}
        max={MAX_PAGES_COLUMNS}
        step={1}
        onValueChange={setMaxColumns}
      />
      <SwitchField
        id={`${idPrefix}show-scroll-badge-switch`}
        label="Show scroll position"
        checked={pagesShowScrollBadge}
        onCheckedChange={setShowScrollBadge}
      />
    </SettingsGroup>
  );
}
