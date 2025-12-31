import { SettingsGroup, SliderField } from "./setting-fields";
import {
  MAX_RECENT_FILES_DAYS,
  MAX_RECENT_FILES_LIMIT,
  useRecentFilesDays,
  useRecentFilesLimit,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export interface RecentFilesSettingsProps {
  idPrefix?: string;
}

export function RecentFilesSettings({
  idPrefix = "",
}: RecentFilesSettingsProps) {
  const recentFilesLimit = useRecentFilesLimit();
  const recentFilesDays = useRecentFilesDays();
  const { setRecentFilesLimit, setRecentFilesDays } = useUxSettingsActions();

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
