// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingsGroup, SwitchField } from "./setting-fields";
import {
  useLoadAllMetadataByDefault,
  useLoadAllMetadataWhenNamespaceSort,
  useMetadataSettingsActions,
} from "@/stores/metadata-settings-store";

export const METADATA_SETTINGS_TITLE = "Metadata loading";

export interface MetadataSettingsProps {
  idPrefix?: string;
}

export function MetadataSettings({ idPrefix = "" }: MetadataSettingsProps) {
  const loadAllMetadataByDefault = useLoadAllMetadataByDefault();
  const loadAllMetadataWhenNamespaceSort =
    useLoadAllMetadataWhenNamespaceSort();
  const { setLoadAllMetadataByDefault, setLoadAllMetadataWhenNamespaceSort } =
    useMetadataSettingsActions();

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}load-all-metadata-by-default-switch`}
        label="Load all metadata by default"
        description="Fetch every metadata page for gallery views without waiting for scroll position."
        checked={loadAllMetadataByDefault}
        onCheckedChange={setLoadAllMetadataByDefault}
      />
      <SwitchField
        id={`${idPrefix}load-all-metadata-when-namespace-sort-switch`}
        label="Load all metadata for namespace sort"
        description="Fetch every metadata page when a search uses namespace sorting."
        checked={loadAllMetadataByDefault || loadAllMetadataWhenNamespaceSort}
        disabled={loadAllMetadataByDefault}
        onCheckedChange={setLoadAllMetadataWhenNamespaceSort}
      />
    </SettingsGroup>
  );
}
