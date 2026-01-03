import { SettingsGroup, SliderField } from "./setting-fields";
import {
  MAX_RECENT_FILES_DAYS,
  MAX_RECENT_FILES_LIMIT,
  useRecentFilesDays,
  useRecentFilesLimit,
  useRecentFilesSettingsActions,
} from "@/stores/recent-files-settings-store";

export const RECENT_FILES_SETTINGS_TITLE = "Recent files";

export interface RecentFilesSettingsProps {
  idPrefix?: string;
}

export function RecentFilesSettings({
  idPrefix = "",
}: RecentFilesSettingsProps) {
  const recentFilesLimit = useRecentFilesLimit();
  const recentFilesDays = useRecentFilesDays();
  const { setLimit, setDays } = useRecentFilesSettingsActions();

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}recent-files-limit-slider`}
        label="Max files"
        value={recentFilesLimit}
        min={100}
        max={MAX_RECENT_FILES_LIMIT}
        step={100}
        onValueChange={setLimit}
        commitOnRelease
      />
      <SliderField
        id={`${idPrefix}recent-files-days-slider`}
        label="Timeframe"
        value={recentFilesDays}
        min={1}
        max={MAX_RECENT_FILES_DAYS}
        step={1}
        onValueChange={setDays}
        formatValue={(v) => (v === 1 ? "Last 24 hours" : `Last ${v} days`)}
        commitOnRelease
      />
    </SettingsGroup>
  );
}
