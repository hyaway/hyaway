import { FilePageHeader } from "./file-page-header";

import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { InlineTagsListSkeleton } from "@/components/tag/inline-tags-list";

export function FileDetailSkeleton({ fileId }: { fileId: number }) {
  return (
    <div className="flex w-full flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* File viewer skeleton */}
        <div className="flex justify-center">
          <Skeleton className="aspect-video w-full max-w-2xl rounded" />
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
    </div>
  );
}
