// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTrashX } from "@tabler/icons-react";
import { SettingsGroup, SwitchField } from "./setting-fields";
import type { ReviewImageLoadMode } from "@/stores/review-settings-store";
import { Button } from "@/components/ui-primitives/button";
import { Label } from "@/components/ui-primitives/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import {
  useReviewImageLoadMode,
  useReviewSettingsActions,
  useReviewTrackWatchHistory,
} from "@/stores/review-settings-store";
import {
  useReviewQueueActions,
  useReviewQueueCount,
} from "@/stores/review-queue-store";

export const REVIEW_QUEUE_SETTINGS_TITLE = "Review queue";

export interface ReviewQueueSettingsProps {
  idPrefix?: string;
}

export function ReviewQueueSettings({
  idPrefix = "",
}: ReviewQueueSettingsProps) {
  const count = useReviewQueueCount();
  const trackWatchHistory = useReviewTrackWatchHistory();
  const imageLoadMode = useReviewImageLoadMode();
  const { setTrackWatchHistory, setImageLoadMode } = useReviewSettingsActions();
  const { clearQueue } = useReviewQueueActions();

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}track-watch-history`}
        label="Track watch history"
        description="Track reviewed files using your watch history settings"
        checked={trackWatchHistory}
        onCheckedChange={setTrackWatchHistory}
      />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <Label>Image loading</Label>
          <span className="text-muted-foreground text-xs">
            Optimized images load faster but may lose quality
          </span>
        </div>
        <ToggleGroup
          value={[imageLoadMode]}
          onValueChange={(value) => {
            const newValue = value[0] as ReviewImageLoadMode | undefined;
            if (newValue) setImageLoadMode(newValue);
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="original">Original</ToggleGroupItem>
          <ToggleGroupItem value="optimized">Optimized</ToggleGroupItem>
        </ToggleGroup>
      </div>
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
