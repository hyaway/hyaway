import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_WATCH_HISTORY_LIMIT,
  useWatchHistoryActions,
  useWatchHistoryEnabled,
  useWatchHistoryLimit,
  useWatchHistorySyncToHydrus,
} from "@/stores/watch-history-store";
import { useFileViewingStatisticsOptions } from "@/integrations/hydrus-api/queries/options";
import { Permission } from "@/integrations/hydrus-api/models";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";

export const WATCH_HISTORY_SETTINGS_TITLE = "Watch history";

export interface HistorySettingsProps {
  idPrefix?: string;
}

export function HistorySettings({ idPrefix = "" }: HistorySettingsProps) {
  const enabled = useWatchHistoryEnabled();
  const limit = useWatchHistoryLimit();
  const syncToHydrus = useWatchHistorySyncToHydrus();
  const { setEnabled, setLimit, setSyncToHydrus } = useWatchHistoryActions();

  const { hasPermission } = usePermissions();
  const { isActive: hydrusStatsActive, isFetched: hydrusOptionsFetched } =
    useFileViewingStatisticsOptions();

  // Sync requires both permissions + Hydrus stats enabled
  const hasEditPermission = hasPermission(Permission.EDIT_FILE_TIMES);
  const hasDatabasePermission = hasPermission(Permission.MANAGE_DATABASE);
  const isSyncEnabled =
    hasEditPermission &&
    hasDatabasePermission &&
    hydrusOptionsFetched &&
    hydrusStatsActive;

  const syncDescription = !hasEditPermission
    ? "Disabled: missing 'Edit file times' permission"
    : !hasDatabasePermission
      ? "Disabled: missing 'Manage database' permission to check Hydrus settings"
      : !hydrusOptionsFetched
        ? "Checking Hydrus settings..."
        : !hydrusStatsActive
          ? "Disabled: file viewing statistics are turned off in Hydrus"
          : "Send views and viewing time to Hydrus";

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
        label="Send new views to Hydrus"
        description={syncDescription}
        checked={syncToHydrus && isSyncEnabled}
        disabled={!isSyncEnabled}
        onCheckedChange={setSyncToHydrus}
      />
    </SettingsGroup>
  );
}
