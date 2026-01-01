import { Link } from "@tanstack/react-router";
import { Item, ItemContent, ItemTitle } from "@/components/ui-primitives/item";
import { ThumbnailImage } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { useGetPageInfoQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { PageState } from "@/integrations/hydrus-api/models";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { Spinner } from "@/components/ui-primitives/spinner";
import { cn } from "@/lib/utils";

const PAGE_STATE_LABELS: Partial<Record<PageState, string>> = {
  [PageState.INITIALIZING]: "Initializing…",
  [PageState.SEARCHING_LOADING]: "Searching…",
  [PageState.SEARCH_CANCELLED]: "Cancelled",
};

export interface PagesGridItemProps {
  pageKey: string;
  pageName: string;
  className?: string;
  tabIndex?: number;
  linkRef?: (el: HTMLAnchorElement | null) => void;
  onFocus?: () => void;
}

/**
 * Pages grid item component that shows page name and thumbnail previews
 */
export function PagesGridItem({
  pageKey,
  pageName,
  className,
  tabIndex = 0,
  linkRef,
  onFocus,
}: PagesGridItemProps) {
  const { data, isLoading } = useGetPageInfoQuery(pageKey, true);

  const pageState = data?.page_info.page_state;
  const pageStateLabel = pageState ? PAGE_STATE_LABELS[pageState] : undefined;

  const totalFiles = data?.page_info.media.num_files ?? 0;
  // Show all 4 thumbnails if 4 or fewer files, otherwise show 3 + count card
  const showCountCard = totalFiles > 4;
  const maxThumbnails = showCountCard ? 3 : 4;
  const remainingFiles = Math.max(totalFiles - 3, 0);
  const previewFileIds =
    data?.page_info.media.hash_ids.slice(0, maxThumbnails) ?? [];

  return (
    <Item
      variant="muted"
      render={
        <Link
          ref={linkRef}
          to="/pages/$pageId"
          params={{ pageId: pageKey }}
          aria-label={`View page "${pageName}" with ${totalFiles} ${totalFiles === 1 ? "file" : "files"}`}
          tabIndex={tabIndex}
          onFocus={onFocus}
        />
      }
      className={cn("block h-full", className)}
    >
      <ItemContent className="mb-3.5">
        {isLoading ? (
          <div
            className="text-muted-foreground flex aspect-square flex-col items-center justify-center gap-2 rounded border border-dashed text-center text-sm"
            aria-label="Loading page preview"
          >
            <Spinner className="size-5" />
            <span>Loading…</span>
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
        ) : pageStateLabel ? (
          <div
            className="text-muted-foreground flex aspect-square flex-col items-center justify-center gap-2 rounded border border-dashed text-center text-sm"
            aria-label={pageStateLabel}
          >
            {pageState !== PageState.SEARCH_CANCELLED && (
              <Spinner className="size-5" />
            )}
            <span>{pageStateLabel}</span>
          </div>
        ) : (
          <div className="text-muted-foreground flex aspect-square items-center justify-center rounded border border-dashed text-sm">
            No files
          </div>
        )}
      </ItemContent>
      <ItemTitle className="line-clamp-2 w-full leading-tight wrap-break-word">
        {pageName}
      </ItemTitle>
    </Item>
  );
}

/**
 * Skeleton placeholder for PagesGridItem during loading state
 */
export function PagesGridItemSkeleton({ className }: { className?: string }) {
  return (
    <Item variant="muted" className={cn("block h-60 w-48", className)}>
      <ItemContent className="mb-3.5">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`skeleton-${i}`} className="aspect-square rounded" />
          ))}
        </div>
      </ItemContent>
      <Skeleton className="h-5 w-3/4" />
    </Item>
  );
}
