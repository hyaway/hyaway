import { IconTrashX } from "@tabler/icons-react";
import { Button } from "@/components/ui-primitives/button";
import {
  useReviewQueueActions,
  useReviewQueueCount,
} from "@/stores/review-queue-store";

export const REVIEW_QUEUE_SETTINGS_TITLE = "Review queue";

export function ReviewQueueSettings() {
  const count = useReviewQueueCount();
  const { clearQueue } = useReviewQueueActions();

  return (
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
  );
}
