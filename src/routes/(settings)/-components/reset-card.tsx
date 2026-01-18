// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingsCardTitle } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import { useAuthActions } from "@/integrations/hydrus-api/hydrus-config-store";
import { useReviewQueueActions } from "@/stores/review-queue-store";
import { useWatchHistoryActions } from "@/stores/watch-history-store";

export function ResetCard({ resetKey }: { resetKey: () => void }) {
  const { reset } = useAuthActions();
  const { clearQueue } = useReviewQueueActions();
  const { clearHistory } = useWatchHistoryActions();

  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>Reset all connection settings</SettingsCardTitle>
        <CardDescription>
          Clears your API endpoint, access key, review queue, and watch history.
          You will need to reconfigure your connection to Hydrus.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          variant="destructive"
          onClick={() => {
            reset();
            resetKey();
            clearQueue();
            clearHistory();
          }}
        >
          Reset API settings
        </Button>
      </CardContent>
    </Card>
  );
}
