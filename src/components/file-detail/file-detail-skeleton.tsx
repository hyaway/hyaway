import { FilePageHeader } from "./file-page-header";
import { FileViewerSettingsPopover } from "./file-viewer-settings-popover";
import { viewerFixedHeight } from "./viewers/style-constants";

import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { InlineTagsListSkeleton } from "@/components/tag/inline-tags-list";
import { LOADING_ACTIONS } from "@/hooks/use-file-actions";
import { cn } from "@/lib/utils";

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
    <div className="flex w-full flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-1 pb-12 sm:gap-2 sm:pb-16">
        {/* File viewer skeleton */}
        <div
          className={cn("flex items-center justify-center", viewerFixedHeight)}
        >
          <Skeleton className="h-full w-full max-w-4xl rounded" />
        </div>

        <FilePageHeader fileId={fileId} />
        <Separator className="my-2" />

        {/* Badges skeleton */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-4xl" />
          <Skeleton className="h-6 w-24 rounded-4xl" />
        </div>
        <Separator className="my-2" />

        {/* Action buttons skeleton */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-28 rounded-4xl" />
          <Skeleton className="h-8 w-36 rounded-4xl" />
        </div>
        <Separator className="my-2" />

        {/* Metadata skeleton */}
        <div className="@container space-y-4">
          <Heading level={2}>File metadata</Heading>
          <div className="grid gap-4 @lg:grid-cols-2">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-6 w-24 shrink-0" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-6 w-24 shrink-0" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <Separator className="my-2" />
        <InlineTagsListSkeleton />
      </div>
      <PageFloatingFooter
        actions={[...(prependActions ?? []), ...LOADING_ACTIONS]}
        rightContent={<FileViewerSettingsPopover />}
      />
    </div>
  );
}
