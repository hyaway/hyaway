import {
  RANDOM_INBOX_SETTINGS_TITLE,
  RandomInboxSettings,
} from "@/components/settings/random-inbox-settings";
import { SettingsResetButton } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { useRandomInboxSettingsActions } from "@/stores/random-inbox-settings-store";

export function RandomInboxSettingsCard() {
  const { reset } = useRandomInboxSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{RANDOM_INBOX_SETTINGS_TITLE}</CardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
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
