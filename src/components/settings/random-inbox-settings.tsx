// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingsGroup, SliderField } from "./setting-fields";
import {
  MAX_SEARCH_LIMIT,
  useRandomInboxLimit,
  useSearchLimitsActions,
} from "@/stores/search-limits-store";

export const RANDOM_INBOX_SETTINGS_TITLE = "Random inbox";

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
  const { setRandomInboxLimit } = useSearchLimitsActions();

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}random-inbox-limit-slider`}
        label="Max files"
        value={randomInboxLimit}
        min={min}
        max={MAX_SEARCH_LIMIT}
        step={step}
        onValueChange={setRandomInboxLimit}
        commitOnRelease
      />
    </SettingsGroup>
  );
}
