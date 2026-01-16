import { SettingsGroup, SwitchField } from "./setting-fields";
import {
  useReviewGesturesEnabled,
  useReviewQueueActions,
  useReviewShortcutsEnabled,
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
  const { setShortcutsEnabled, setGesturesEnabled } = useReviewQueueActions();

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
    </SettingsGroup>
  );
}
