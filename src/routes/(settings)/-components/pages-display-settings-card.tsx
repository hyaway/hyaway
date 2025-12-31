import { PagesDisplaySettings } from "@/components/settings/pages-display-settings";
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
        <CardTitle>Pages display</CardTitle>
        <CardDescription>
          Configure how page cards are displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PagesDisplaySettings />
      </CardContent>
    </Card>
  );
}
