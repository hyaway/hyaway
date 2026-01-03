import {
  FILE_VIEWER_SETTINGS_TITLE,
  FileViewerSettings,
} from "@/components/settings/file-viewer-settings";
import { SettingsResetButton } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { useFileViewerSettingsActions } from "@/stores/file-viewer-settings-store";

export function FileViewerSettingsCard() {
  const { reset } = useFileViewerSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{FILE_VIEWER_SETTINGS_TITLE}</CardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Configure how the file viewer is displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileViewerSettings />
      </CardContent>
    </Card>
  );
}
