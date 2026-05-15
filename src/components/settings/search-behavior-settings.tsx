// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SwitchField } from "@/components/settings/setting-fields";
import {
  useSearchResultsInstantDefault,
  useSearchSettingsActions,
} from "@/stores/search-settings-store";

export function SearchBehaviorSettings() {
  const searchResultsInstantDefault = useSearchResultsInstantDefault();
  const { setSearchResultsInstantDefault } = useSearchSettingsActions();

  return (
    <SwitchField
      id="search-results-instant-default-switch"
      label="Instant search by default"
      description="Search result pages run as soon as their query or sort changes unless the page URL overrides it."
      checked={searchResultsInstantDefault}
      onCheckedChange={setSearchResultsInstantDefault}
    />
  );
}
