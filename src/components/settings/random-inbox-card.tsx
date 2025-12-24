import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { SliderField } from "@/components/settings/setting-fields";
import {
  MAX_RANDOM_INBOX_LIMIT,
  useRandomInboxLimit,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function RandomInboxCard() {
  const randomInboxLimit = useRandomInboxLimit();
  const { setRandomInboxLimit } = useUxSettingsActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Random inbox</CardTitle>
        <CardDescription>
          Configure how many files are fetched for the random inbox view.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SliderField
          id="random-inbox-limit-slider"
          label="Limit returned files to"
          value={randomInboxLimit}
          min={100}
          max={MAX_RANDOM_INBOX_LIMIT}
          step={100}
          onValueChange={setRandomInboxLimit}
          commitOnRelease
        />
      </CardContent>
    </Card>
  );
}
