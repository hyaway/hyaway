import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_HISTORY_LIMIT,
  useHistoryActions,
  useHistoryEnabled,
  useHistoryLimit,
} from "@/lib/history-store";

export const HISTORY_SETTINGS_TITLE = "Watch history";

export interface HistorySettingsProps {
  idPrefix?: string;
}

export function HistorySettings({ idPrefix = "" }: HistorySettingsProps) {
  const enabled = useHistoryEnabled();
  const limit = useHistoryLimit();
  const { setEnabled, setLimit } = useHistoryActions();

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}history-enabled-switch`}
        label="Record new views"
        description="Existing history is kept when disabled"
        checked={enabled}
        onCheckedChange={setEnabled}
      />
      <SliderField
        id={`${idPrefix}history-limit-slider`}
        label="Maximum entries to keep"
        value={limit}
        min={10}
        max={MAX_HISTORY_LIMIT}
        step={10}
        onValueChange={setLimit}
        commitOnRelease
      />
    </SettingsGroup>
  );
}
