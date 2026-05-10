// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingsGroup, SwitchField } from "./setting-fields";
import {
  useAllowSystemOnlySearch,
  useSearchSettingsActions,
} from "@/stores/search-settings-store";

export const SEARCH_SETTINGS_TITLE = "Search";

export interface SearchSettingsProps {
  idPrefix?: string;
}

export function SearchSettings({ idPrefix = "" }: SearchSettingsProps) {
  const allowSystemOnlySearch = useAllowSystemOnlySearch();
  const { setAllowSystemOnlySearch } = useSearchSettingsActions();

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}allow-system-only-search`}
        label="Allow system-only searches"
        description="Queries without tags scan the full file set, which can be slow on large databases"
        checked={allowSystemOnlySearch}
        onCheckedChange={setAllowSystemOnlySearch}
      />
    </SettingsGroup>
  );
}
