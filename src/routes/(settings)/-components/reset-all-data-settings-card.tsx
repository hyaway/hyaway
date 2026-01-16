import { SettingsCardTitle } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import { useReviewQueueActions } from "@/stores/review-queue-store";
import { useSearchLimitsActions } from "@/stores/search-limits-store";
import { useWatchHistoryActions } from "@/stores/watch-history-store";

export function ResetAllDataSettingsCard() {
  const { reset: resetSearchLimits } = useSearchLimitsActions();
  const { reset: resetWatchHistory } = useWatchHistoryActions();
  const { resetDataSettings: resetReviewData } = useReviewQueueActions();

  const handleResetAll = () => {
    resetSearchLimits();
    resetWatchHistory();
    resetReviewData();
  };

  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>Reset all data settings</SettingsCardTitle>
        <CardDescription>
          Reset all settings on this page to their default values. This does not
          clear your watch history entries or review queue.
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
