import { IconTrashX } from "@tabler/icons-react";
import { SettingsGroup, SwitchField } from "./setting-fields";
import { Button } from "@/components/ui-primitives/button";
import {
  useReviewQueueActions,
  useReviewQueueCount,
} from "@/stores/review-queue-store";
import {
  useReviewGesturesEnabled,
  useReviewSettingsActions,
  useReviewShortcutsEnabled,
} from "@/stores/review-settings-store";

export const REVIEW_QUEUE_SETTINGS_TITLE = "Review queue";

export interface ReviewQueueSettingsProps {
  idPrefix?: string;
}

export function ReviewQueueSettings({
  idPrefix = "",
}: ReviewQueueSettingsProps) {
  const count = useReviewQueueCount();
  const { clearQueue } = useReviewQueueActions();
  const shortcutsEnabled = useReviewShortcutsEnabled();
  const gesturesEnabled = useReviewGesturesEnabled();
  const { setShortcutsEnabled, setGesturesEnabled } =
    useReviewSettingsActions();

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}shortcuts-enabled`}
        label="Keyboard shortcuts"
        description="Use keyboard to archive, trash, or skip files"
        checked={shortcutsEnabled}
        onCheckedChange={setShortcutsEnabled}
      />
      <SwitchField
        id={`${idPrefix}gestures-enabled`}
        label="Swipe gestures"
        description="Swipe cards to archive, trash, or skip files"
        checked={gesturesEnabled}
        onCheckedChange={setGesturesEnabled}
      />
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Clear queue</span>
          <span className="text-muted-foreground text-xs">
            {count} {count === 1 ? "file" : "files"} in queue
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearQueue}
          disabled={count === 0}
        >
          <IconTrashX data-icon="inline-start" />
          Clear
        </Button>
      </div>
    </SettingsGroup>
  );
}
