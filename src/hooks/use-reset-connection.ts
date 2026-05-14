// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from "react";
import { useAuthActions } from "@/integrations/hydrus-api/hydrus-config-store";
import { useReviewQueueActions } from "@/stores/review-queue-store";
import { clearSearchQueries } from "@/stores/search-queries-store";
import { useWatchHistoryActions } from "@/stores/watch-history-store";

/**
 * Resets auth, review queue, watch history, and saved searches.
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
    clearSearchQueries();
  }, [resetAuth, clearQueue, clearHistory]);
}
