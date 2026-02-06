// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  REVIEW_QUEUE_SETTINGS_TITLE,
  ReviewQueueSettings,
} from "@/components/settings/review-queue-settings";
import {
  SettingsCardTitle,
  SettingsResetButton,
} from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import { useReviewSettingsActions } from "@/stores/review-settings-store";

export function ReviewQueueSettingsCard() {
  const { resetDataSettings } = useReviewSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>{REVIEW_QUEUE_SETTINGS_TITLE}</SettingsCardTitle>
          <SettingsResetButton onReset={resetDataSettings} />
        </div>
        <CardDescription>
          Manage the review queue for batch archive/trash decisions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReviewQueueSettings />
      </CardContent>
    </Card>
  );
}
