import { SliderField } from "./setting-fields";
import {
  MAX_PAGES_COLUMNS,
  usePagesMaxColumns,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export interface PagesSettingsProps {
  idPrefix?: string;
}

export function PagesSettings({ idPrefix = "" }: PagesSettingsProps) {
  const pagesMaxColumns = usePagesMaxColumns();
  const { setPagesMaxColumns } = useUxSettingsActions();

  return (
    <SliderField
      id={`${idPrefix}pages-columns-slider`}
      label="Maximum columns"
      value={pagesMaxColumns}
      min={3}
      max={MAX_PAGES_COLUMNS}
      step={1}
      onValueChange={setPagesMaxColumns}
    />
  );
}
