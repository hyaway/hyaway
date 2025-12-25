import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui-primitives/card";
import { ThumbnailImage } from "@/components/image-grid/image-grid-card";
import { useGetPageInfoQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { cn } from "@/lib/utils";

export interface PageCardProps {
  pageKey: string;
  pageName: string;
  className?: string;
}

/**
 * Page card preview component that shows page name and thumbnail previews
 */
export function PageCard({ pageKey, pageName, className }: PageCardProps) {
  const { data, isLoading } = useGetPageInfoQuery(pageKey, true);

  const totalFiles = data?.page_info.media.num_files ?? 0;
  // Show all 4 thumbnails if 4 or fewer files, otherwise show 3 + count card
  const showCountCard = totalFiles > 4;
  const maxThumbnails = showCountCard ? 3 : 4;
  const remainingFiles = Math.max(totalFiles - 3, 0);
  const previewFileIds =
    data?.page_info.media.hash_ids.slice(0, maxThumbnails) ?? [];

  return (
    <Link
      to="/pages/$pageId"
      params={{ pageId: pageKey }}
      className="hover:ring-primary focus-visible:ring-primary block h-full transition-transform hover:scale-[1.02] hover:ring-2 focus-visible:scale-[1.02] focus-visible:ring-3 focus-visible:outline-none"
      aria-label={`View page "${pageName}" with ${totalFiles} ${totalFiles === 1 ? "file" : "files"}`}
    >
      <Card className={cn("h-full", className)}>
        <CardContent>
          {isLoading ? (
            <div
              className="grid grid-cols-2 gap-2"
              aria-label="Loading page preview"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={`skeleton-${i}`}
                  className="aspect-square rounded"
                />
              ))}
            </div>
          ) : previewFileIds.length > 0 ? (
            <div
              className="grid grid-cols-2 gap-2"
              role="img"
              aria-label={`Preview of ${totalFiles} files`}
            >
              {previewFileIds.map((fileId) => (
                <div
                  key={fileId}
                  className="bg-muted aspect-square overflow-hidden rounded"
                >
                  <ThumbnailImage fileId={fileId} />
                </div>
              ))}
              {/* Show +N count card when more than 4 files */}
              {showCountCard && (
                <div
                  className="bg-muted text-muted-foreground flex aspect-square items-center justify-center rounded text-sm font-medium"
                  aria-label={`${remainingFiles} more files`}
                >
                  +{remainingFiles}
                </div>
              )}
              {/* Fill empty slots to maintain 2x2 grid */}
              {Array.from({
                length: Math.max(
                  0,
                  (showCountCard ? 3 : 4) - previewFileIds.length,
                ),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded border border-dashed bg-transparent"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex aspect-square items-center justify-center rounded border border-dashed text-sm">
              No files
            </div>
          )}
        </CardContent>
        <CardFooter>
          <CardTitle className="line-clamp-2 leading-tight wrap-break-word">
            {pageName}
          </CardTitle>
        </CardFooter>
      </Card>
    </Link>
  );
}

/**
 * Skeleton placeholder for PageCard during loading state
 */
export function PageCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`skeleton-${i}`} className="aspect-square rounded" />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-5 w-3/4" />
      </CardFooter>
    </Card>
  );
}
