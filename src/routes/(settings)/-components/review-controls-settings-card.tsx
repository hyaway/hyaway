// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  REVIEW_CONTROLS_SETTINGS_TITLE,
  ReviewControlsSettings,
} from "@/components/settings/review-controls-settings";
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
import {
  useReviewQueueIsComplete,
  useReviewQueueIsEmpty,
} from "@/stores/review-queue-store";

export function ReviewControlsSettingsCard() {
  const { resetControlsSettings, resetBindings } = useReviewSettingsActions();
  const isEmpty = useReviewQueueIsEmpty();
  const isComplete = useReviewQueueIsComplete();
  const hasActiveQueue = !isEmpty && !isComplete;

  const handleReset = () => {
    resetControlsSettings();
    if (!hasActiveQueue) {
      resetBindings();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>
            {REVIEW_CONTROLS_SETTINGS_TITLE}
          </SettingsCardTitle>
          <SettingsResetButton onReset={handleReset} />
        </div>
        <CardDescription>
          Configure how you interact with files during review mode.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReviewControlsSettings
          idPrefix="settings-"
          openMultiple
          defaultSections={["controls"]}
        />
      </CardContent>
    </Card>
  );
}
