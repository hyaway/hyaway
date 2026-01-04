import { SettingsGroup, SliderField } from "./setting-fields";
import {
  MAX_RECENT_FILES_DAYS,
  MAX_SEARCH_LIMIT,
  useRecentFilesDays,
  useRecentFilesLimit,
  useSearchLimitsActions,
} from "@/stores/search-limits-store";

export const RECENT_FILES_SETTINGS_TITLE = "Recent files";

export interface RecentFilesSettingsProps {
  idPrefix?: string;
}

export function RecentFilesSettings({
  idPrefix = "",
}: RecentFilesSettingsProps) {
  const recentFilesLimit = useRecentFilesLimit();
  const recentFilesDays = useRecentFilesDays();
  const { setRecentFilesLimit, setRecentFilesDays } = useSearchLimitsActions();

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}recent-files-limit-slider`}
        label="Max files"
        value={recentFilesLimit}
        min={100}
        max={MAX_SEARCH_LIMIT}
        step={100}
        onValueChange={setRecentFilesLimit}
        commitOnRelease
      />
      <SliderField
        id={`${idPrefix}recent-files-days-slider`}
        label="Timeframe"
        value={recentFilesDays}
        min={1}
        max={MAX_RECENT_FILES_DAYS}
        step={1}
        onValueChange={setRecentFilesDays}
        formatValue={(v) => (v === 1 ? "Last 24 hours" : `Last ${v} days`)}
        commitOnRelease
      />
    </SettingsGroup>
  );
}
