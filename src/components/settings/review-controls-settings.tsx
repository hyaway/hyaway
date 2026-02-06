// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_SWIPE_THRESHOLD,
  MIN_SWIPE_THRESHOLD,
  useReviewGesturesEnabled,
  useReviewSettingsActions,
  useReviewShortcutsEnabled,
  useReviewShowGestureThresholds,
  useReviewSwipeThresholds,
} from "@/stores/review-settings-store";

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
  const thresholds = useReviewSwipeThresholds();
  const {
    setShortcutsEnabled,
    setGesturesEnabled,
    setShowGestureThresholds,
    setThreshold,
  } = useReviewSettingsActions();

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
        id={`${idPrefix}left-threshold`}
        label="Left threshold"
        value={thresholds.left}
        min={MIN_SWIPE_THRESHOLD}
        max={MAX_SWIPE_THRESHOLD}
        step={5}
        onValueChange={(v) => setThreshold("left", v)}
        formatValue={(v) => `${v * 2}%`}
      />
      <SliderField
        id={`${idPrefix}right-threshold`}
        label="Right threshold"
        value={thresholds.right}
        min={MIN_SWIPE_THRESHOLD}
        max={MAX_SWIPE_THRESHOLD}
        step={5}
        onValueChange={(v) => setThreshold("right", v)}
        formatValue={(v) => `${v * 2}%`}
      />
      <SliderField
        id={`${idPrefix}up-threshold`}
        label="Up threshold"
        value={thresholds.up}
        min={MIN_SWIPE_THRESHOLD}
        max={MAX_SWIPE_THRESHOLD}
        step={5}
        onValueChange={(v) => setThreshold("up", v)}
        formatValue={(v) => `${v * 2}%`}
      />
      <SliderField
        id={`${idPrefix}down-threshold`}
        label="Down threshold"
        value={thresholds.down}
        min={MIN_SWIPE_THRESHOLD}
        max={MAX_SWIPE_THRESHOLD}
        step={5}
        onValueChange={(v) => setThreshold("down", v)}
        formatValue={(v) => `${v * 2}%`}
      />
    </SettingsGroup>
  );
}
