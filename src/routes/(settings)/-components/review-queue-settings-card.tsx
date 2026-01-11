import {
  REVIEW_QUEUE_SETTINGS_TITLE,
  ReviewQueueSettings,
} from "@/components/settings/review-queue-settings";
import { SettingsCardTitle } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";

export function ReviewQueueSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>{REVIEW_QUEUE_SETTINGS_TITLE}</SettingsCardTitle>
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
