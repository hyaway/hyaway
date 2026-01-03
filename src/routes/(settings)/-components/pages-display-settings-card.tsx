import {
  PAGES_DISPLAY_SETTINGS_TITLE,
  PagesDisplaySettings,
} from "@/components/settings/pages-display-settings";
import { SettingsResetButton } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { usePagesSettingsActions } from "@/stores/pages-settings-store";

export function PagesDisplaySettingsCard() {
  const { reset } = usePagesSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{PAGES_DISPLAY_SETTINGS_TITLE}</CardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
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
