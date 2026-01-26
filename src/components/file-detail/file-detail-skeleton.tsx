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
import { SectionHeading } from "@/components/page-shell/section-heading";
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
      <div className="flex min-w-0 flex-1 flex-col gap-2 pb-12 sm:pb-16">
        <FileViewerSkeleton />
        <FilePageHeader fileId={fileId} />
        <Separator className="my-2" />
        <div className="flex items-center justify-between gap-2">
          <FileStatusBadgesSkeleton />
        </div>
        <Separator className="my-2" />

        <div className="@container flex flex-col gap-2">
          <SectionHeading title="File metadata" />
          <div className="grid gap-2 @lg:grid-cols-2">
            <MetadataListSkeleton rows={5} />
            <MetadataListSkeleton rows={5} />
          </div>
        </div>
        <Separator className="my-2" />
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
