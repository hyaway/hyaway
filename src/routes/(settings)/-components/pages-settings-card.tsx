import { PagesSettings } from "@/components/settings/pages-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";

export function PagesSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pages display</CardTitle>
        <CardDescription>
          Configure how page cards are displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PagesSettings />
      </CardContent>
    </Card>
  );
}
