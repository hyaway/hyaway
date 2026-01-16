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
import { useReviewQueueActions } from "@/stores/review-queue-store";

export function ReviewControlsSettingsCard() {
  const { resetControlsSettings } = useReviewQueueActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <SettingsCardTitle>
            {REVIEW_CONTROLS_SETTINGS_TITLE}
          </SettingsCardTitle>
          <SettingsResetButton onReset={resetControlsSettings} />
        </div>
        <CardDescription>
          Configure how you interact with files during review mode.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReviewControlsSettings />
      </CardContent>
    </Card>
  );
}
