import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { useSearchLimitsActions } from "@/stores/search-limits-store";
import { useWatchHistoryActions } from "@/stores/watch-history-store";

export function ResetAllDataSettingsCard() {
  const { reset: resetSearchLimits } = useSearchLimitsActions();
  const { reset: resetWatchHistory } = useWatchHistoryActions();

  const handleResetAll = () => {
    resetSearchLimits();
    resetWatchHistory();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset all data settings</CardTitle>
        <CardDescription>
          Reset all settings on this page to their default values. This does not
          clear your watch history entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button variant="destructive" onClick={handleResetAll}>
          Reset data settings
        </Button>
      </CardContent>
    </Card>
  );
}
