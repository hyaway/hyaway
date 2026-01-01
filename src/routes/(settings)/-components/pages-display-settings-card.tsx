import {
  PAGES_DISPLAY_SETTINGS_TITLE,
  PagesDisplaySettings,
} from "@/components/settings/pages-display-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";

export function PagesDisplaySettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{PAGES_DISPLAY_SETTINGS_TITLE}</CardTitle>
        <CardDescription>
          Configure how pages grid items are displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PagesDisplaySettings />
      </CardContent>
    </Card>
  );
}
