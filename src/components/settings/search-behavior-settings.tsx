// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SwitchField } from "@/components/settings/setting-fields";
import {
  useCreateSearchesInstant,
  useSearchSettingsActions,
} from "@/stores/search-settings-store";

export function SearchBehaviorSettings() {
  const createSearchesInstant = useCreateSearchesInstant();
  const { setCreateSearchesInstant } = useSearchSettingsActions();

  return (
    <SwitchField
      id="create-searches-instant-switch"
      label="Create searches as instant"
      description="New searches will run as soon as their query or sort changes."
      checked={createSearchesInstant}
      onCheckedChange={setCreateSearchesInstant}
    />
  );
}
