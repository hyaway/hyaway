import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import {
  SettingsGroup,
  SwitchField,
} from "@/components/settings/setting-fields";
import {
  useFileViewerStartExpanded,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function FileViewerCard() {
  const fileViewerStartExpanded = useFileViewerStartExpanded();
  const { setFileViewerStartExpanded } = useUxSettingsActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>File viewer</CardTitle>
        <CardDescription>
          Configure how the file viewer is displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsGroup>
          <SwitchField
            id="file-viewer-start-expanded-switch"
            label="Start images expanded"
            checked={fileViewerStartExpanded}
            onCheckedChange={setFileViewerStartExpanded}
          />
        </SettingsGroup>
      </CardContent>
    </Card>
  );
}
