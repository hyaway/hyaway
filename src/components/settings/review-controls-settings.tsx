// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_SWIPE_THRESHOLD,
  MIN_SWIPE_THRESHOLD,
  useReviewGesturesEnabled,
  useReviewHorizontalThreshold,
  useReviewQueueActions,
  useReviewShortcutsEnabled,
  useReviewShowGestureThresholds,
  useReviewVerticalThreshold,
} from "@/stores/review-queue-store";

export const REVIEW_CONTROLS_SETTINGS_TITLE = "Review controls";

export interface ReviewControlsSettingsProps {
  idPrefix?: string;
}

export function ReviewControlsSettings({
  idPrefix = "",
}: ReviewControlsSettingsProps) {
  const shortcutsEnabled = useReviewShortcutsEnabled();
  const gesturesEnabled = useReviewGesturesEnabled();
  const showGestureThresholds = useReviewShowGestureThresholds();
  const horizontalThreshold = useReviewHorizontalThreshold();
  const verticalThreshold = useReviewVerticalThreshold();
  const {
    setShortcutsEnabled,
    setGesturesEnabled,
    setShowGestureThresholds,
    setHorizontalThreshold,
    setVerticalThreshold,
  } = useReviewQueueActions();

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
      <SwitchField
        id={`${idPrefix}show-gesture-thresholds`}
        label="Show gesture thresholds"
        description="Display threshold lines when swiping"
        checked={showGestureThresholds}
        onCheckedChange={setShowGestureThresholds}
        disabled={!gesturesEnabled}
      />
      <SliderField
        id={`${idPrefix}horizontal-threshold`}
        label="Horizontal threshold"
        value={horizontalThreshold}
        min={MIN_SWIPE_THRESHOLD}
        max={MAX_SWIPE_THRESHOLD}
        step={5}
        onValueChange={setHorizontalThreshold}
        formatValue={(v) => `${v * 2}%`}
      />
      <SliderField
        id={`${idPrefix}vertical-threshold`}
        label="Vertical threshold"
        value={verticalThreshold}
        min={MIN_SWIPE_THRESHOLD}
        max={MAX_SWIPE_THRESHOLD}
        step={5}
        onValueChange={setVerticalThreshold}
        formatValue={(v) => `${v * 2}%`}
      />
    </SettingsGroup>
  );
}
