import { SettingsGroup, SliderField } from "./setting-fields";
import {
  MAX_RANDOM_INBOX_LIMIT,
  useRandomInboxLimit,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export interface RandomInboxSettingsProps {
  idPrefix?: string;
  /** Minimum value for the slider (card uses 100, popover uses 10) */
  min?: number;
  /** Step value for the slider (card uses 100, popover uses 10) */
  step?: number;
}

export function RandomInboxSettings({
  idPrefix = "",
  min = 100,
  step = 100,
}: RandomInboxSettingsProps) {
  const randomInboxLimit = useRandomInboxLimit();
  const { setRandomInboxLimit } = useUxSettingsActions();

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}random-inbox-limit-slider`}
        label="Limit returned files to"
        value={randomInboxLimit}
        min={min}
        max={MAX_RANDOM_INBOX_LIMIT}
        step={step}
        onValueChange={setRandomInboxLimit}
        commitOnRelease
      />
    </SettingsGroup>
  );
}
