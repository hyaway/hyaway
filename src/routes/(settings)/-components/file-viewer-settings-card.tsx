import { FileViewerSettings } from "@/components/settings/file-viewer-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";

export function FileViewerSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Media viewer</CardTitle>
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
