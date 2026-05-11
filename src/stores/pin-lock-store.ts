// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useEffect } from "react";
import { simpleHash } from "@/lib/simple-hash";

const PIN_STORAGE_KEY = "hyaway-pin-lock";
const SESSION_UNLOCK_KEY = "hyaway-pin-unlocked";

/** Sentinel value: auto-lock is disabled */
export const AUTO_LOCK_OFF = -1;

/**
 * Hash a PIN for storage comparison using djb2.
 * This is not a secure hash and is only meant to obfuscate the PIN for local storage.
 * Anyone could always clear the local storage to remove the PIN lock,
 * and self-hosting is often done via HTTP where cryptographic features are not available.
 */
function hashPin(pin: string): string {
  return simpleHash(pin).toString(16);
}

type PinLockState = {
  /** Hash of the PIN, or empty string if no PIN is set */
  pinHash: string;
  /** Seconds of inactivity before auto-locking. AUTO_LOCK_OFF = off, 0 = always (immediate). */
  lockAfterSeconds: number;
  /** Whether the current session has been unlocked (not persisted) */
  isUnlocked: boolean;
  _hasHydrated: boolean;
  actions: {
    setPin: (pin: string) => void;
    removePin: () => void;
    verifyPin: (pin: string) => boolean;
    unlockSession: () => void;
    lockSession: () => void;
    setLockAfterSeconds: (seconds: number) => void;
    setHasHydrated: (state: boolean) => void;
  };
};

export const usePinLockStore = create<PinLockState>()(
  persist(
    (set, get) => ({
      pinHash: "",
      lockAfterSeconds: AUTO_LOCK_OFF,
      isUnlocked: isSessionUnlockedFromStorage(),
      _hasHydrated: false,
      actions: {
        setPin: (pin: string) => {
          const hash = hashPin(pin);
          set({ pinHash: hash });
        },
        removePin: () => {
          set({ pinHash: "", isUnlocked: false });
          sessionStorage.removeItem(SESSION_UNLOCK_KEY);
        },
        verifyPin: (pin: string) => {
          const { pinHash } = get();
          if (!pinHash) return true;
          const hash = hashPin(pin);
          return hash === pinHash;
        },
        unlockSession: () => {
          sessionStorage.setItem(SESSION_UNLOCK_KEY, "true");
          set({ isUnlocked: true });
        },
        lockSession: () => {
          sessionStorage.removeItem(SESSION_UNLOCK_KEY);
          set({ isUnlocked: false });
        },
        setLockAfterSeconds: (seconds: number) => {
          set({ lockAfterSeconds: seconds });
        },
        setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      },
    }),
    {
      name: PIN_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pinHash: state.pinHash,
        lockAfterSeconds: state.lockAfterSeconds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.actions.setHasHydrated(true);
      },
    },
  ),
);

// Selectors
export const usePinHash = () => usePinLockStore((state) => state.pinHash);
export const useIsPinEnabled = () =>
  usePinLockStore((state) => state.pinHash !== "");
export const usePinLockActions = () =>
  usePinLockStore((state) => state.actions);
export const useLockAfterSeconds = () =>
  usePinLockStore((state) => state.lockAfterSeconds);
export const usePinLockHydrated = () =>
  usePinLockStore((state) => state._hasHydrated);

/** Read session unlock state from sessionStorage (for store initialization). */
function isSessionUnlockedFromStorage(): boolean {
  return sessionStorage.getItem(SESSION_UNLOCK_KEY) === "true";
}

/** Check whether the lock screen should be shown */
export function useShouldShowLockScreen(): boolean {
  const isPinEnabled = useIsPinEnabled();
  const hasHydrated = usePinLockHydrated();
  const isUnlocked = usePinLockStore((state) => state.isUnlocked);

  if (!hasHydrated || !isPinEnabled) return false;
  return !isUnlocked;
}

/** Auto-lock the app after N seconds of being hidden (tab switch, minimize, etc.) */
export function useAutoLock() {
  useEffect(() => {
    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      const { lockAfterSeconds, pinHash, actions } = usePinLockStore.getState();
      if (!pinHash || lockAfterSeconds === AUTO_LOCK_OFF) return;

      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null) {
        const elapsed = Date.now() - hiddenAt;
        hiddenAt = null;
        if (elapsed >= lockAfterSeconds * 1_000) {
          actions.lockSession();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
