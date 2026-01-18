// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { FilePageHeader } from "./file-page-header";
import { FileStatusBadgesSkeleton } from "./file-status-badges";
import { FileViewerSettingsPopover } from "./file-viewer-settings-popover";
import { FileViewerSkeleton } from "./file-viewer";
import { MetadataListSkeleton } from "./metadata-list";

import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";
import { InlineTagsListSkeleton } from "@/components/tag/inline-tags-list";
import { LOADING_ACTIONS } from "@/hooks/use-file-actions";

export interface FileDetailSkeletonProps {
  fileId: number;
  /** Navigation actions to show during loading (e.g., prev/next) */
  prependActions?: Array<FloatingFooterAction>;
}

export function FileDetailSkeleton({
  fileId,
  prependActions,
}: FileDetailSkeletonProps) {
  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pb-12 sm:gap-2 sm:pb-16">
        <FileViewerSkeleton />
        <FilePageHeader fileId={fileId} />
        <Separator className="mt-4" />
        <div className="flex items-center justify-between gap-2">
          <FileStatusBadgesSkeleton />
        </div>
        <Separator className="mb-4" />

        <div className="@container space-y-4">
          <Heading level={2}>File metadata</Heading>
          <div className="grid gap-4 @lg:grid-cols-2">
            <MetadataListSkeleton rows={5} />
            <MetadataListSkeleton rows={5} />
          </div>
        </div>
        <Separator className="mt-2 mb-4" />
        <InlineTagsListSkeleton />
      </div>
      <PageHeaderActions>
        <FileViewerSettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter
        actions={[...(prependActions ?? []), ...LOADING_ACTIONS]}
      />
    </>
  );
}
