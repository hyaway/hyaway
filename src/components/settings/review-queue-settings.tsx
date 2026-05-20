// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTrashX } from "@tabler/icons-react";
import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import type { ReviewImageLoadMode } from "@/stores/review-settings-store";
import { Button } from "@/components/ui-primitives/button";
import { Label } from "@/components/ui-primitives/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import {
  MAX_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB,
  MAX_REVIEW_RENDER_QUALITY,
  MIN_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB,
  MIN_REVIEW_RENDER_QUALITY,
  useReviewImageLoadMode,
  useReviewOptimizeSizeThresholdMB,
  useReviewRenderQuality,
  useReviewSettingsActions,
  useReviewTrackWatchHistory,
} from "@/stores/review-settings-store";
import {
  useReviewQueueActions,
  useReviewQueueCount,
} from "@/stores/review-queue-store";
import {
  formatOptimizeSizeThresholdMB,
  sizeThresholdToSliderValue,
  sliderValueToSizeThreshold,
} from "@/lib/optimize-image-settings";

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
  const renderQuality = useReviewRenderQuality();
  const optimizeSizeThresholdMB = useReviewOptimizeSizeThresholdMB();
  const {
    setTrackWatchHistory,
    setImageLoadMode,
    setRenderQuality,
    setOptimizeSizeThresholdMB,
  } = useReviewSettingsActions();
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
          <div className="text-muted-foreground space-y-1 text-xs">
            <p>Original uses the full image file, which keeps all detail.</p>
            <p>
              Optimized asks Hydrus for a smaller image, which can load faster
              with a small quality tradeoff.
            </p>
          </div>
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
        {imageLoadMode === "optimized" && (
          <>
            <SliderField
              id={`${idPrefix}review-render-quality`}
              label="Optimized quality"
              value={renderQuality}
              min={MIN_REVIEW_RENDER_QUALITY}
              max={MAX_REVIEW_RENDER_QUALITY}
              step={1}
              onValueChange={setRenderQuality}
              formatValue={(v) => `${v}`}
              commitOnRelease
            />
            <SliderField
              id={`${idPrefix}review-optimize-size-threshold`}
              label="Optimize images over"
              value={sizeThresholdToSliderValue(optimizeSizeThresholdMB)}
              min={MIN_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB}
              max={MAX_REVIEW_OPTIMIZE_SIZE_THRESHOLD_MB + 1}
              step={1}
              onValueChange={(value) =>
                setOptimizeSizeThresholdMB(sliderValueToSizeThreshold(value))
              }
              formatValue={(value) => {
                const sizeMB = sliderValueToSizeThreshold(value);
                return formatOptimizeSizeThresholdMB(sizeMB);
              }}
              commitOnRelease
            />
          </>
        )}
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
