import {
  RECENT_FILES_SETTINGS_TITLE,
  RecentFilesSettings,
} from "@/components/settings/recent-files-settings";
import { SettingsResetButton } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { useRecentFilesSettingsActions } from "@/stores/recent-files-settings-store";

export function RecentFilesSettingsCard() {
  const { reset } = useRecentFilesSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{RECENT_FILES_SETTINGS_TITLE}</CardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Configure how recent files are fetched for inbox, archive, and trash
          views.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RecentFilesSettings />
      </CardContent>
    </Card>
  );
}
