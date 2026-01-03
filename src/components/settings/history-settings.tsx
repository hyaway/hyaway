import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_WATCH_HISTORY_LIMIT,
  useWatchHistoryActions,
  useWatchHistoryEnabled,
  useWatchHistoryLimit,
} from "@/lib/stores/watch-history-store";

export const WATCH_HISTORY_SETTINGS_TITLE = "Watch history";

export interface HistorySettingsProps {
  idPrefix?: string;
}

export function HistorySettings({ idPrefix = "" }: HistorySettingsProps) {
  const enabled = useWatchHistoryEnabled();
  const limit = useWatchHistoryLimit();
  const { setEnabled, setLimit } = useWatchHistoryActions();

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
        label="Max entries"
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
