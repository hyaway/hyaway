// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export const DEFAULT_LOAD_ALL_METADATA_BY_DEFAULT = false;
export const DEFAULT_LOAD_ALL_METADATA_WHEN_NAMESPACE_SORT = false;
export const DEFAULT_METADATA_BATCH_SIZE = 128;
export const MIN_METADATA_BATCH_SIZE = 128;
export const MAX_METADATA_BATCH_SIZE = 1024;
export const METADATA_BATCH_SIZE_STEP = 128;

type MetadataSettingsState = {
  loadAllMetadataByDefault: boolean;
  loadAllMetadataWhenNamespaceSort: boolean;
  metadataBatchSize: number;
  actions: {
    setLoadAllMetadataByDefault: (load: boolean) => void;
    setLoadAllMetadataWhenNamespaceSort: (load: boolean) => void;
    setMetadataBatchSize: (size: number) => void;
    reset: () => void;
  };
};

function normalizeMetadataBatchSize(size: number) {
  const clamped = Math.min(
    MAX_METADATA_BATCH_SIZE,
    Math.max(MIN_METADATA_BATCH_SIZE, size),
  );
  return (
    Math.round(clamped / METADATA_BATCH_SIZE_STEP) * METADATA_BATCH_SIZE_STEP
  );
}

const useMetadataSettingsStore = create<MetadataSettingsState>()(
  persist(
    (set, _get, store) => ({
      loadAllMetadataByDefault: DEFAULT_LOAD_ALL_METADATA_BY_DEFAULT,
      loadAllMetadataWhenNamespaceSort:
        DEFAULT_LOAD_ALL_METADATA_WHEN_NAMESPACE_SORT,
      metadataBatchSize: DEFAULT_METADATA_BATCH_SIZE,
      actions: {
        setLoadAllMetadataByDefault: (loadAllMetadataByDefault: boolean) =>
          set({ loadAllMetadataByDefault }),
        setLoadAllMetadataWhenNamespaceSort: (
          loadAllMetadataWhenNamespaceSort: boolean,
        ) => set({ loadAllMetadataWhenNamespaceSort }),
        setMetadataBatchSize: (metadataBatchSize: number) =>
          set({
            metadataBatchSize: normalizeMetadataBatchSize(metadataBatchSize),
          }),
        reset: () => set(store.getInitialState()),
      },
    }),
    {
      name: "hyaway-metadata-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useLoadAllMetadataByDefault = () =>
  useMetadataSettingsStore((state) => state.loadAllMetadataByDefault);

export const useLoadAllMetadataWhenNamespaceSort = () =>
  useMetadataSettingsStore((state) => state.loadAllMetadataWhenNamespaceSort);

export const useMetadataBatchSize = () =>
  useMetadataSettingsStore((state) => state.metadataBatchSize);

export const useMetadataSettingsActions = () =>
  useMetadataSettingsStore((state) => state.actions);

setupCrossTabSync(useMetadataSettingsStore);
