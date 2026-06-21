// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type {ReviewTagsSortMode} from "@/stores/tags-settings-store";
import { RightSidebarPortal } from "@/components/app-shell/right-sidebar-portal";
import { TagsSidebar } from "@/components/tag/tags-sidebar";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useReviewQueueCurrentFileId } from "@/stores/review-queue-store";
import {
  
  useReviewTagsSortMode,
  useTagsSettingsActions
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

  if (currentFileId === undefined) return null;

  return (
    <RightSidebarPortal>
      <TagsSidebar
        items={currentMetadata ? [currentMetadata] : []}
        title="Current file"
        showIndex={false}
        sort={{
          mode: reviewSortMode,
          onChange: (mode) => setReviewSortMode(mode as ReviewTagsSortMode),
          options: REVIEW_SORT_OPTIONS,
        }}
      />
    </RightSidebarPortal>
  );
}
