// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  REVIEW_RATINGS_SETTINGS_TITLE,
  ReviewRatingsSettings,
} from "@/components/settings/review-ratings-settings";
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
import { useReviewRatingsSettingsActions } from "@/stores/review-ratings-settings-store";

export function ReviewRatingsSettingsCard() {
  const { reset } = useReviewRatingsSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>{REVIEW_RATINGS_SETTINGS_TITLE}</SettingsCardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Choose which rating services appear in review mode footer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReviewRatingsSettings />
      </CardContent>
    </Card>
  );
}
