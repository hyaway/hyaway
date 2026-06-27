// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

export const DEFAULT_LOAD_ALL_METADATA_BY_DEFAULT = false;
export const DEFAULT_LOAD_ALL_METADATA_WHEN_NAMESPACE_SORT = false;

type MetadataSettingsState = {
  loadAllMetadataByDefault: boolean;
  loadAllMetadataWhenNamespaceSort: boolean;
  actions: {
    setLoadAllMetadataByDefault: (load: boolean) => void;
    setLoadAllMetadataWhenNamespaceSort: (load: boolean) => void;
    reset: () => void;
  };
};

const useMetadataSettingsStore = create<MetadataSettingsState>()(
  persist(
    (set, _get, store) => ({
      loadAllMetadataByDefault: DEFAULT_LOAD_ALL_METADATA_BY_DEFAULT,
      loadAllMetadataWhenNamespaceSort:
        DEFAULT_LOAD_ALL_METADATA_WHEN_NAMESPACE_SORT,
      actions: {
        setLoadAllMetadataByDefault: (loadAllMetadataByDefault: boolean) =>
          set({ loadAllMetadataByDefault }),
        setLoadAllMetadataWhenNamespaceSort: (
          loadAllMetadataWhenNamespaceSort: boolean,
        ) => set({ loadAllMetadataWhenNamespaceSort }),
        reset: () => set(store.getInitialState()),
      },
    }),
    {
      name: "hyaway-metadata-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({
        loadAllMetadataByDefault,
        loadAllMetadataWhenNamespaceSort,
      }) => ({
        loadAllMetadataByDefault,
        loadAllMetadataWhenNamespaceSort,
      }),
    },
  ),
);

export const useLoadAllMetadataByDefault = () =>
  useMetadataSettingsStore((state) => state.loadAllMetadataByDefault);

export const useLoadAllMetadataWhenNamespaceSort = () =>
  useMetadataSettingsStore((state) => state.loadAllMetadataWhenNamespaceSort);

export const useMetadataSettingsActions = () =>
  useMetadataSettingsStore((state) => state.actions);

setupCrossTabSync(useMetadataSettingsStore);
