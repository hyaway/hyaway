import {
  SEARCH_LIMITS_SETTINGS_TITLE,
  SearchLimitsSettings,
} from "@/components/settings/search-limits-settings";
import { SettingsResetButton } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { useSearchLimitsActions } from "@/stores/search-limits-store";

export function SearchLimitsSettingsCard() {
  const { reset } = useSearchLimitsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{SEARCH_LIMITS_SETTINGS_TITLE}</CardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Configure how many files are fetched for various search queries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SearchLimitsSettings />
      </CardContent>
    </Card>
  );
}
