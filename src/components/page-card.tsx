import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { ThumbnailImage } from "@/components/image-grid/image-grid-card";
import { useGetPageInfoQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { Skeleton } from "@/components/ui-primitives/skeleton";

export interface PageCardProps {
  pageKey: string;
  pageName: string;
}

/**
 * Page card preview component that shows page name and thumbnail previews
 */
export function PageCard({ pageKey, pageName }: PageCardProps) {
  const { data, isLoading } = useGetPageInfoQuery(pageKey, true);

  const totalFiles = data?.page_info.media.num_files ?? 0;
  // Get first 3 file IDs for preview thumbnails (leave room for count card)
  const remainingFiles = totalFiles - 3;
  const showCountCard = remainingFiles > 0;
  const previewFileIds =
    data?.page_info.media.hash_ids.slice(0, showCountCard ? 3 : 4) ?? [];

  return (
    <Link
      to="/pages/$pageId"
      params={{ pageId: pageKey }}
      className="block transition-transform hover:scale-[1.02] focus-visible:scale-[1.02] focus-visible:outline-none"
      aria-label={`View page "${pageName}" with ${totalFiles} ${totalFiles === 1 ? "file" : "files"}`}
    >
      <Card className="hover:ring-primary/50 h-full min-w-44 transition-shadow hover:ring-2">
        <CardHeader>
          <CardTitle className="truncate">{pageName}</CardTitle>
        </CardHeader>
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
              {/* Show +N count card if there are more files */}
              {showCountCard && (
                <div
                  className="bg-muted text-muted-foreground flex aspect-square items-center justify-center rounded text-sm font-medium"
                  aria-label={`${remainingFiles} more files`}
                >
                  +{remainingFiles}
                </div>
              )}
              {/* Fill empty slots if less than 4 total items */}
              {!showCountCard &&
                Array.from({
                  length: Math.max(0, 4 - previewFileIds.length),
                }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="bg-muted aspect-square rounded"
                    aria-hidden="true"
                  />
                ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
              No files
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Skeleton placeholder for PageCard during loading state
 */
export function PageCardSkeleton() {
  return (
    <Card className="h-full min-w-44">
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`skeleton-${i}`} className="aspect-square rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
