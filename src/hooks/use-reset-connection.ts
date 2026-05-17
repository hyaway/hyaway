// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from "react";
import { useAuthActions } from "@/integrations/hydrus-api/hydrus-config-store";
import { useReviewQueueActions } from "@/stores/review-queue-store";
import { useSearchQueriesActions } from "@/stores/search-queries-store";
import { useSearchSettingsActions } from "@/stores/search-settings-store";
import { useWatchHistoryActions } from "@/stores/watch-history-store";

/**
 * Resets auth and clears local data tied to the disconnected API context.
 * Callers can run additional cleanup before/after.
 */
export function useResetConnection() {
  const { reset: resetAuth } = useAuthActions();
  const { clearQueue } = useReviewQueueActions();
  const { clearHistory } = useWatchHistoryActions();
  const { clearSavedSearches } = useSearchQueriesActions();
  const { resetDefaultQuery } = useSearchSettingsActions();

  return useCallback(() => {
    resetAuth();
    clearQueue();
    clearHistory();
    clearSavedSearches();
    resetDefaultQuery();
  }, [
    resetAuth,
    resetDefaultQuery,
    clearQueue,
    clearHistory,
    clearSavedSearches,
  ]);
}
