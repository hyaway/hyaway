// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_METADATA_BATCH_SIZE,
  METADATA_BATCH_SIZE_STEP,
  MIN_METADATA_BATCH_SIZE,
  useLoadAllMetadataByDefault,
  useLoadAllMetadataWhenNamespaceSort,
  useMetadataBatchSize,
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
  const metadataBatchSize = useMetadataBatchSize();
  const {
    setLoadAllMetadataByDefault,
    setLoadAllMetadataWhenNamespaceSort,
    setMetadataBatchSize,
  } = useMetadataSettingsActions();

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
      <SliderField
        id={`${idPrefix}metadata-batch-size-slider`}
        label="Metadata batch size"
        value={metadataBatchSize}
        min={MIN_METADATA_BATCH_SIZE}
        max={MAX_METADATA_BATCH_SIZE}
        step={METADATA_BATCH_SIZE_STEP}
        onValueChange={setMetadataBatchSize}
        commitOnRelease
      />
    </SettingsGroup>
  );
}
