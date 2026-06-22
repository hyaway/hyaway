// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import type { ReviewTagsSortMode } from "@/stores/tags-settings-store";
import { RightSidebarPortal } from "@/components/app-shell/right-sidebar-portal";
import { TagsSidebar } from "@/components/tag/tags-sidebar";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useReviewQueueCurrentFileId } from "@/stores/review-queue-store";
import {
  useReviewTagsSortMode,
  useTagsSettingsActions,
} from "@/stores/tags-settings-store";

const REVIEW_SORT_OPTIONS = [
  { value: "alpha", label: "Alpha" },
  { value: "namespace", label: "Namespace" },
] as const;

/**
 * Mounts the current review card's tags into the app's right sidebar
 * (read-only). Renders nothing when there is no current card, so the
 * right-sidebar toggle only appears while reviewing.
 */
export function ReviewTagsSidebar() {
  const currentFileId = useReviewQueueCurrentFileId();
  // Hooks must run unconditionally; the query is disabled for falsy ids.
  const { data: currentMetadata } = useGetSingleFileMetadata(
    currentFileId ?? 0,
  );
  const reviewSortMode = useReviewTagsSortMode();
  const { setReviewSortMode } = useTagsSettingsActions();

  // Stabilise the props handed to TagsSidebar. A fresh `items` array (or `sort`
  // object) every render keeps TagsSidebar's internal useDeferredValue(items)
  // in a perpetual transition, which stops the deferred sort mode from
  // settling — so the displayed order lags behind the Alpha/Namespace toggle.
  // Memoising keeps identities stable so the sort tracks the toggle. (The
  // gallery already passes a stable, deferred array, which is why it's fine.)
  const items = useMemo(
    () => (currentMetadata ? [currentMetadata] : []),
    [currentMetadata],
  );
  const sort = useMemo(
    () => ({
      mode: reviewSortMode,
      onChange: (mode: string) => setReviewSortMode(mode as ReviewTagsSortMode),
      options: REVIEW_SORT_OPTIONS,
    }),
    [reviewSortMode, setReviewSortMode],
  );

  if (currentFileId === undefined) return null;

  return (
    <RightSidebarPortal>
      <TagsSidebar
        items={items}
        title="Current file"
        showIndex={false}
        sort={sort}
      />
    </RightSidebarPortal>
  );
}
