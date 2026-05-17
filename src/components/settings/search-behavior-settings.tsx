// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SwitchField } from "@/components/settings/setting-fields";
import {
  useSearchResultsBuilderDefault,
  useSearchResultsInstantDefault,
  useSearchSettingsActions,
} from "@/stores/search-settings-store";

export function SearchBehaviorSettings() {
  const searchResultsInstantDefault = useSearchResultsInstantDefault();
  const searchResultsBuilderDefault = useSearchResultsBuilderDefault();
  const { setSearchResultsBuilderDefault, setSearchResultsInstantDefault } =
    useSearchSettingsActions();

  return (
    <>
      <SwitchField
        id="search-results-instant-default-switch"
        label="Instant search by default"
        description="Search result pages run as soon as their query or sort changes unless the page URL overrides it."
        checked={searchResultsInstantDefault}
        onCheckedChange={setSearchResultsInstantDefault}
      />
      <SwitchField
        id="search-results-builder-default-switch"
        label="Open builder by default"
        description="Search result pages open with the query builder expanded unless the page URL overrides it."
        checked={searchResultsBuilderDefault}
        onCheckedChange={setSearchResultsBuilderDefault}
      />
    </>
  );
}
