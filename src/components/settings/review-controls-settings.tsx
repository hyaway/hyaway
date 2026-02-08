// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { IconTrashX } from "@tabler/icons-react";
import {
  AccordionSection,
  SettingsGroup,
  SliderField,
  SwitchField,
} from "./setting-fields";
import { SwipeBindingsConfig } from "./swipe-bindings-config";
import { Button } from "@/components/ui-primitives/button";
import { Accordion } from "@/components/ui-primitives/accordion";
import { Label } from "@/components/ui-primitives/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import {
  MAX_SWIPE_THRESHOLD,
  MIN_SWIPE_THRESHOLD,
  useReviewGesturesEnabled,
  useReviewImmersiveMode,
  useReviewSettingsActions,
  useReviewShortcutsEnabled,
  useReviewShowGestureThresholds,
  useReviewSwipeThresholds,
} from "@/stores/review-settings-store";
import {
  useReviewQueueActions,
  useReviewQueueCount,
  useReviewQueueIsComplete,
  useReviewQueueIsEmpty,
} from "@/stores/review-queue-store";

export const REVIEW_CONTROLS_SETTINGS_TITLE = "Review controls";

export interface ReviewControlsSettingsProps {
  idPrefix?: string;
  /** When true, allows multiple accordion sections to be open at once */
  openMultiple?: boolean;
  /** Accordion sections to open initially (e.g., "controls", "swipe-actions", "thresholds") */
  defaultSections?: Array<string>;
}

export function ReviewControlsSettings({
  idPrefix = "",
  openMultiple = false,
  defaultSections = [],
}: ReviewControlsSettingsProps) {
  const shortcutsEnabled = useReviewShortcutsEnabled();
  const gesturesEnabled = useReviewGesturesEnabled();
  const showGestureThresholds = useReviewShowGestureThresholds();
  const immersiveMode = useReviewImmersiveMode();
  const thresholds = useReviewSwipeThresholds();
  const {
    setShortcutsEnabled,
    setGesturesEnabled,
    setShowGestureThresholds,
    setImmersiveMode,
    setThreshold,
  } = useReviewSettingsActions();

  const count = useReviewQueueCount();
  const isEmpty = useReviewQueueIsEmpty();
  const isComplete = useReviewQueueIsComplete();
  const { clearQueue } = useReviewQueueActions();

  const hasActiveQueue = !isEmpty && !isComplete;

  const [openSections, setOpenSections] =
    useState<Array<string>>(defaultSections);

  return (
    <div className="flex flex-col gap-5">
      <SettingsGroup>
        <SwitchField
          id={`${idPrefix}shortcuts-enabled`}
          label="Keyboard shortcuts"
          description="Use keyboard to archive, trash, or skip files"
          checked={shortcutsEnabled}
          onCheckedChange={setShortcutsEnabled}
        />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <Label>Display mode</Label>
            <span className="text-muted-foreground text-xs">
              Theater mode hides most UI for a more immersive review experience
            </span>
          </div>
          <ToggleGroup
            value={[immersiveMode ? "theater" : "regular"]}
            onValueChange={(value) => {
              const newValue = value[0] as "regular" | "theater" | undefined;
              if (newValue) setImmersiveMode(newValue === "theater");
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="regular">Regular</ToggleGroupItem>
            <ToggleGroupItem value="theater">Theater</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </SettingsGroup>

      <Accordion
        multiple={openMultiple}
        value={openSections}
        onValueChange={setOpenSections}
        className="rounded-none border-0"
      >
        <AccordionSection value="swipe-actions" title="Swipe actions">
          <SwitchField
            id={`${idPrefix}gestures-enabled`}
            label="Swipe gestures"
            description="Swipe cards to archive, trash, or skip files"
            checked={gesturesEnabled}
            onCheckedChange={setGesturesEnabled}
          />
          {hasActiveQueue && (
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">
                  Clear the queue to edit swipe actions
                </span>
                <span className="text-muted-foreground text-xs">
                  {count} {count === 1 ? "file" : "files"} in queue
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={clearQueue}>
                <IconTrashX data-icon="inline-start" />
                Clear
              </Button>
            </div>
          )}
          <SwipeBindingsConfig
            showHeader={false}
            disabled={hasActiveQueue}
            columns={1}
          />
        </AccordionSection>

        <AccordionSection value="thresholds" title="Thresholds">
          <SettingsGroup>
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
              step={2.5}
              onValueChange={(v) => setThreshold("left", v)}
              formatValue={(v) => `${v * 2}%`}
            />
            <SliderField
              id={`${idPrefix}right-threshold`}
              label="Right threshold"
              value={thresholds.right}
              min={MIN_SWIPE_THRESHOLD}
              max={MAX_SWIPE_THRESHOLD}
              step={2.5}
              onValueChange={(v) => setThreshold("right", v)}
              formatValue={(v) => `${v * 2}%`}
            />
            <SliderField
              id={`${idPrefix}up-threshold`}
              label="Up threshold"
              value={thresholds.up}
              min={MIN_SWIPE_THRESHOLD}
              max={MAX_SWIPE_THRESHOLD}
              step={2.5}
              onValueChange={(v) => setThreshold("up", v)}
              formatValue={(v) => `${v * 2}%`}
            />
            <SliderField
              id={`${idPrefix}down-threshold`}
              label="Down threshold"
              value={thresholds.down}
              min={MIN_SWIPE_THRESHOLD}
              max={MAX_SWIPE_THRESHOLD}
              step={2.5}
              onValueChange={(v) => setThreshold("down", v)}
              formatValue={(v) => `${v * 2}%`}
            />
          </SettingsGroup>
        </AccordionSection>
      </Accordion>
    </div>
  );
}
