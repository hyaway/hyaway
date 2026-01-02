import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import { MAX_HISTORY_LIMIT, useHistory } from "@/lib/history-store";

export const HISTORY_SETTINGS_TITLE = "Watch history";

export interface HistorySettingsProps {
  idPrefix?: string;
}

export function HistorySettings({ idPrefix = "" }: HistorySettingsProps) {
  const enabled = useHistory.enabled();
  const limit = useHistory.limit();
  const { setEnabled, setLimit } = useHistory.actions();

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
