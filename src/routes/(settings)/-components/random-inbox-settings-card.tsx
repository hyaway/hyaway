import {
  RANDOM_INBOX_SETTINGS_TITLE,
  RandomInboxSettings,
} from "@/components/settings/random-inbox-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";

export function RandomInboxSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{RANDOM_INBOX_SETTINGS_TITLE}</CardTitle>
        <CardDescription>
          Configure how many files are fetched for the random inbox view.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RandomInboxSettings />
      </CardContent>
    </Card>
  );
}
