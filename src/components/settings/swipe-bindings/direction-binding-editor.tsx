// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconArchive,
  IconArrowBackUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconPlayerTrackNext,
  IconTrash,
} from "@tabler/icons-react";
import { SwipeRatingActionsEditor } from "./swipe-rating-actions-editor";
import { SwipeTagActionsEditor } from "./swipe-tag-actions-editor";
import type { ComponentType } from "react";
import type {
  ReviewFileAction,
  SwipeDirection,
} from "@/stores/review-settings-store";
import {
  DEFAULT_SWIPE_BINDINGS,
  isReviewSwipeBindingModified,
  useReviewSettingsActions,
  useReviewSwipeBinding,
} from "@/stores/review-settings-store";
import { Label } from "@/components/ui-primitives/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import { SettingsResetButton } from "@/components/settings/settings-ui";

const DIRECTION_CONFIG: Record<
  SwipeDirection,
  {
    label: string;
    icon: ComponentType<{ className?: string }>;
  }
> = {
  left: { label: "Swipe Left", icon: IconArrowLeft },
  right: { label: "Swipe Right", icon: IconArrowRight },
  up: { label: "Swipe Up", icon: IconArrowUp },
  down: { label: "Swipe Down", icon: IconArrowDown },
};

const PRIMARY_ACTIONS: Array<{
  value: ReviewFileAction;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "archive", label: "Archive", icon: IconArchive },
  { value: "trash", label: "Trash", icon: IconTrash },
  { value: "skip", label: "Skip", icon: IconPlayerTrackNext },
  { value: "undo", label: "Undo", icon: IconArrowBackUp },
];

interface DirectionBindingEditorProps {
  direction: SwipeDirection;
}

export function DirectionBindingEditor({
  direction,
}: DirectionBindingEditorProps) {
  const binding = useReviewSwipeBinding(direction);
  const { setBinding } = useReviewSettingsActions();
  const config = DIRECTION_CONFIG[direction];
  const DirectionIcon = config.icon;
  const isModified = isReviewSwipeBindingModified(direction, binding);

  const handleBindingChange = (nextBinding: typeof binding) => {
    setBinding(direction, nextBinding);
  };

  const handleReset = () => {
    setBinding(direction, DEFAULT_SWIPE_BINDINGS[direction]);
  };

  const handlePrimaryActionChange = (value: Array<string>) => {
    const primaryAction = value[0] as ReviewFileAction | undefined;
    if (!primaryAction) {
      return;
    }

    handleBindingChange({
      ...binding,
      fileAction: primaryAction,
      ...(primaryAction === "undo" ? { secondaryActions: undefined } : {}),
    });
  };

  return (
    <div className="@container flex min-w-0 flex-col gap-3 rounded-lg border p-3 sm:p-4">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DirectionIcon className="text-muted-foreground size-5" />
          <span className="font-medium">{config.label}</span>
        </div>
        {isModified && (
          <SettingsResetButton
            onReset={handleReset}
            label={`Reset ${config.label}`}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <Label className="text-muted-foreground text-xs">Primary action</Label>
        <ToggleGroup
          value={[binding.fileAction]}
          onValueChange={handlePrimaryActionChange}
          variant="outline"
          size="sm"
          className="flex-wrap justify-start"
        >
          {PRIMARY_ACTIONS.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} aria-label={label}>
              <Icon className="size-4" />
              <span className="hidden @[10rem]:inline">{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {binding.fileAction !== "undo" && (
        <SwipeTagActionsEditor
          binding={binding}
          onBindingChange={handleBindingChange}
        />
      )}

      {binding.fileAction !== "undo" && (
        <SwipeRatingActionsEditor
          binding={binding}
          onBindingChange={handleBindingChange}
        />
      )}
    </div>
  );
}
