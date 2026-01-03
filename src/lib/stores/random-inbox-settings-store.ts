import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { setupCrossTabSync } from "../cross-tab-sync";

export const MAX_RANDOM_INBOX_LIMIT = 1000;

type RandomInboxSettingsState = {
  limit: number;
  actions: {
    setLimit: (limit: number) => void;
  };
};

const useRandomInboxSettingsStore = create<RandomInboxSettingsState>()(
  persist(
    (set) => ({
      limit: 100,
      actions: {
        setLimit: (limit: number) => set({ limit }),
      },
    }),
    {
      name: "random-inbox-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

export const useRandomInboxLimit = () =>
  useRandomInboxSettingsStore((state) => state.limit);

export const useRandomInboxSettingsActions = () =>
  useRandomInboxSettingsStore((state) => state.actions);

// Sync settings across tabs
setupCrossTabSync(useRandomInboxSettingsStore);
