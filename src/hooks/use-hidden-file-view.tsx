// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconEye } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { ReviewSource } from "@/stores/review-queue-store";
import {
  clearHiddenFileIdsInViewCaches,
  formatHiddenFileCount,
  getHiddenFileCount,
  getHiddenFileIds,
  getVisibleFileIds,
} from "@/integrations/hydrus-api/queries/file-metadata-cache";

function useShowHiddenFilesAction({
  hiddenFileIds,
  source,
}: {
  hiddenFileIds: Array<number>;
  source: ReviewSource;
}): FloatingFooterAction | null {
  const queryClient = useQueryClient();

  if (hiddenFileIds.length === 0) return null;

  return {
    id: "show-hidden-files",
    label: `Show ${hiddenFileIds.length} hidden files`,
    icon: IconEye,
    onClick: () => clearHiddenFileIdsInViewCaches(queryClient, source),
    overflowOnly: true,
  };
}

export function useHiddenFileView({
  data,
  fileIds,
  source,
}: {
  data: unknown;
  fileIds: Array<number>;
  source: ReviewSource;
}) {
  const hiddenFileIds = getHiddenFileIds(data);
  const visibleFileIds = getVisibleFileIds(fileIds, data);
  const hiddenLabel = formatHiddenFileCount(getHiddenFileCount(data));
  const showHiddenFilesAction = useShowHiddenFilesAction({
    hiddenFileIds,
    source,
  });

  return {
    hiddenFileIds,
    visibleFileIds,
    hiddenLabel,
    showHiddenFilesAction,
  };
}
