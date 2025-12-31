import { RecentFilesSettings } from "@/components/settings/recent-files-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";

export function RecentFilesSettingsCard() {
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
        <RecentFilesSettings />
      </CardContent>
    </Card>
  );
}
