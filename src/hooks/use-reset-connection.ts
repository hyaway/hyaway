// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from "react";
import { useAuthActions } from "@/integrations/hydrus-api/hydrus-config-store";
import { useReviewQueueActions } from "@/stores/review-queue-store";
import { useWatchHistoryActions } from "@/stores/watch-history-store";

/**
 * Resets auth, review queue, and watch history.
 * Callers can run additional cleanup before/after.
 */
export function useResetConnection() {
  const { reset: resetAuth } = useAuthActions();
  const { clearQueue } = useReviewQueueActions();
  const { clearHistory } = useWatchHistoryActions();

  return useCallback(() => {
    resetAuth();
    clearQueue();
    clearHistory();
  }, [resetAuth, clearQueue, clearHistory]);
}
