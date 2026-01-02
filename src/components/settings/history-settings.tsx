import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_WATCH_HISTORY_LIMIT,
  useWatchHistory,
} from "@/lib/watch-history-store";

export const HISTORY_SETTINGS_TITLE = "Watch history";

export interface HistorySettingsProps {
  idPrefix?: string;
}

export function HistorySettings({ idPrefix = "" }: HistorySettingsProps) {
  const enabled = useWatchHistory.enabled();
  const limit = useWatchHistory.limit();
  const { setEnabled, setLimit } = useWatchHistory.actions();

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
        max={MAX_WATCH_HISTORY_LIMIT}
        step={10}
        onValueChange={setLimit}
        commitOnRelease
      />
    </SettingsGroup>
  );
}
