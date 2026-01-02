import { SettingsGroup, SliderField } from "./setting-fields";
import {
  MAX_RECENT_FILES_DAYS,
  MAX_RECENT_FILES_LIMIT,
  useRecentFilesDays,
  useRecentFilesLimit,
  useSettingsActions,
} from "@/lib/settings-store";

export const RECENT_FILES_SETTINGS_TITLE = "Recent files";

export interface RecentFilesSettingsProps {
  idPrefix?: string;
}

export function RecentFilesSettings({
  idPrefix = "",
}: RecentFilesSettingsProps) {
  const recentFilesLimit = useRecentFilesLimit();
  const recentFilesDays = useRecentFilesDays();
  const { setRecentFilesLimit, setRecentFilesDays } = useSettingsActions();

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}recent-files-limit-slider`}
        label="Limit returned files to"
        value={recentFilesLimit}
        min={100}
        max={MAX_RECENT_FILES_LIMIT}
        step={100}
        onValueChange={setRecentFilesLimit}
        commitOnRelease
      />
      <SliderField
        id={`${idPrefix}recent-files-days-slider`}
        label="Days to consider recent"
        value={recentFilesDays}
        min={1}
        max={MAX_RECENT_FILES_DAYS}
        step={1}
        onValueChange={setRecentFilesDays}
        commitOnRelease
      />
    </SettingsGroup>
  );
}
