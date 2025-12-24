import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import {
  SettingsGroup,
  SliderField,
} from "@/components/settings/setting-fields";
import {
  MAX_RECENT_FILES_DAYS,
  MAX_RECENT_FILES_LIMIT,
  useRecentFilesDays,
  useRecentFilesLimit,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function RecentFilesCard() {
  const recentFilesLimit = useRecentFilesLimit();
  const recentFilesDays = useRecentFilesDays();
  const { setRecentFilesLimit, setRecentFilesDays } = useUxSettingsActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent files</CardTitle>
        <CardDescription>
          Configure how recent files are fetched for inbox, archive, and trash
          views.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsGroup>
          <SliderField
            id="recent-files-limit-slider"
            label="Limit returned files to"
            value={recentFilesLimit}
            min={100}
            max={MAX_RECENT_FILES_LIMIT}
            step={100}
            onValueChange={setRecentFilesLimit}
            commitOnRelease
          />
          <SliderField
            id="recent-files-days-slider"
            label="Days to consider recent"
            value={recentFilesDays}
            min={1}
            max={MAX_RECENT_FILES_DAYS}
            step={1}
            onValueChange={setRecentFilesDays}
            commitOnRelease
          />
        </SettingsGroup>
      </CardContent>
    </Card>
  );
}
