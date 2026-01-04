import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_WATCH_HISTORY_LIMIT,
  useWatchHistoryActions,
  useWatchHistoryEnabled,
  useWatchHistoryLimit,
  useWatchHistorySyncToHydrus,
} from "@/stores/watch-history-store";
import { useFileViewingStatisticsOptions } from "@/integrations/hydrus-api/queries/options";

export const WATCH_HISTORY_SETTINGS_TITLE = "Watch history";

export interface HistorySettingsProps {
  idPrefix?: string;
}

export function HistorySettings({ idPrefix = "" }: HistorySettingsProps) {
  const enabled = useWatchHistoryEnabled();
  const limit = useWatchHistoryLimit();
  const syncToHydrus = useWatchHistorySyncToHydrus();
  const { setEnabled, setLimit, setSyncToHydrus } = useWatchHistoryActions();

  const { isActive: hydrusStatsActive, isFetched: hydrusOptionsFetched } =
    useFileViewingStatisticsOptions();

  // Determine if sync to hydrus is disabled and why
  const isSyncDisabled = hydrusOptionsFetched && !hydrusStatsActive;
  const syncDescription = isSyncDisabled
    ? "Disabled: file viewing statistics are turned off in Hydrus"
    : "Send views and view time to Hydrus file viewing statistics";

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}history-enabled-switch`}
        label="Record new views in HyAway"
        description="Current entries are kept when disabled"
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
      <SwitchField
        id={`${idPrefix}history-sync-hydrus-switch`}
        label="Sync new views to Hydrus"
        description={syncDescription}
        checked={syncToHydrus && !isSyncDisabled}
        disabled={isSyncDisabled}
        onCheckedChange={setSyncToHydrus}
      />
    </SettingsGroup>
  );
}
