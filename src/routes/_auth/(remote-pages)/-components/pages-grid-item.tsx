// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Link } from "@tanstack/react-router";
import {
  IconCaretRightFilled,
  IconPoint,
  IconPointFilled,
} from "@tabler/icons-react";
import { memo } from "react";
import { HighlightedText } from "./pages-highlighted-text";
import { Item, ItemContent, ItemTitle } from "@/components/ui-primitives/item";
import { ThumbnailImage } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { useGetPageInfoQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { PageState } from "@/integrations/hydrus-api/models";
import { Skeleton } from "@/components/ui-primitives/skeleton";
import { Spinner } from "@/components/ui-primitives/spinner";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PAGE_CARD_WIDTH,
  PAGE_CARD_ASPECT_RATIO,
  usePagesUseFriendlyUrls,
} from "@/stores/pages-settings-store";

const PAGE_STATE_LABELS: Partial<Record<PageState, string>> = {
  [PageState.INITIALIZING]: "Initializing…",
  [PageState.SEARCHING_LOADING]: "Searching…",
  [PageState.SEARCH_CANCELLED]: "Cancelled",
};

export interface PagesGridItemProps {
  pageKey: string;
  pageName: string;
  /** URL-friendly slug for the page link */
  pageSlug: string;
  index: number;
  className?: string;
  tabIndex?: number;
  /** Stable callback to register link refs - receives (element, index) */
  setLinkRef?: (el: HTMLAnchorElement | null, index: number) => void;
  /** Stable callback for focus events - receives index */
  onItemFocus?: (index: number) => void;
  labelRef?: (el: HTMLSpanElement | null) => void;
  getGroupLabelRef?: (index: number) => (el: HTMLSpanElement | null) => void;
  highlightQuery?: string;
  useCustomHighlight?: boolean;
  groupLabel?: string;
  groupStripeColorsByLevel?: Array<string | null>;
}

/**
 * Pages grid item component that shows page name and thumbnail previews
 */
export const PagesGridItem = memo(function PagesGridItem({
  pageKey,
  pageName,
  pageSlug,
  index,
  className,
  tabIndex = 0,
  setLinkRef,
  onItemFocus,
  labelRef,
  getGroupLabelRef,
  highlightQuery = "",
  useCustomHighlight = false,
  groupLabel,
  groupStripeColorsByLevel = [],
}: PagesGridItemProps) {
  const { data, isLoading } = useGetPageInfoQuery(pageKey, true);
  const useFriendlyUrls = usePagesUseFriendlyUrls();
  const groupSegments = groupLabel ? groupLabel.split(" / ") : [];
  const activeStripeColors = groupStripeColorsByLevel.filter(
    (color): color is string => Boolean(color),
  );

  const pageState = data?.page_info.page_state;
  const pageStateLabel = pageState ? PAGE_STATE_LABELS[pageState] : undefined;

  // Use slug if friendly URLs enabled, otherwise use full page_key
  const linkPageId = useFriendlyUrls ? pageSlug : pageKey;
  const previewAspectClass = "aspect-square";

  const totalFiles = data?.page_info.media.num_files ?? 0;
  // Show all 4 thumbnails if 4 or fewer files, otherwise show 3 + count card
  const showCountCard = totalFiles > 4;
  const maxThumbnails = showCountCard ? 3 : 4;
  const remainingFiles = Math.max(totalFiles - 3, 0);
  const previewFileIds =
    data?.page_info.media.hash_ids.slice(0, maxThumbnails) ?? [];
  const totalSlots = 4;
  const filledSlots = previewFileIds.length + (showCountCard ? 1 : 0);
  const emptySlots = Math.max(0, totalSlots - filledSlots);

  return (
    <Item
      variant="muted"
      size="xs"
      render={
        <Link
          ref={(el) => setLinkRef?.(el, index)}
          to="/pages/$pageId"
          params={{ pageId: linkPageId }}
          aria-label={`View page "${pageName}" with ${totalFiles} ${totalFiles === 1 ? "file" : "files"}`}
          tabIndex={tabIndex}
          onFocus={() => onItemFocus?.(index)}
        />
      }
      className={cn(
        "relative flex h-full flex-col flex-nowrap items-stretch",
        className,
      )}
    >
      {activeStripeColors.length > 0 ? (
        <div className="absolute inset-x-1.5 bottom-0 flex gap-1">
          {activeStripeColors.map((color, colorIndex) => (
            <span
              key={`${color}-${colorIndex}`}
              className="h-1 w-full rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      ) : null}
      <ItemContent className="min-h-0 flex-1">
        {isLoading ? (
          <div
            className={cn(
              "text-muted-foreground flex flex-col items-center justify-center gap-2 rounded border border-dashed text-center text-sm",
              previewAspectClass,
            )}
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
            {/* Show +N count card when more than 2/4 files */}
            {showCountCard && (
              <div
                className="bg-primary/80 text-primary-foreground flex aspect-square items-center justify-center rounded text-sm font-medium"
                aria-label={`${remainingFiles} more files`}
              >
                +{remainingFiles}
              </div>
            )}
            {/* Fill empty slots to maintain 2x2 grid */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded border border-dashed bg-transparent"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : pageStateLabel ? (
          <div
            className={cn(
              "text-muted-foreground flex flex-col items-center justify-center gap-2 rounded border border-dashed text-center text-sm",
              previewAspectClass,
            )}
            aria-label={pageStateLabel}
          >
            {pageState !== PageState.SEARCH_CANCELLED && (
              <Spinner className="size-5" />
            )}
            <span>{pageStateLabel}</span>
          </div>
        ) : (
          <div
            className={cn(
              "text-muted-foreground flex items-center justify-center rounded border border-dashed text-sm",
              previewAspectClass,
            )}
          >
            No files
          </div>
        )}
      </ItemContent>
      <ItemTitle className="mt-auto block w-full min-w-0 text-sm/5 wrap-break-word">
        <div
          className="flex flex-col gap-0.5 rounded-lg bg-transparent px-1 py-1 backdrop-blur-3xl supports-backdrop-filter:bg-transparent"
          title={groupLabel ? `${groupLabel} / ${pageName}` : pageName}
        >
          {groupLabel ? (
            <span className="text-foreground line-clamp-1 flex min-w-0 flex-wrap items-center gap-x-0.5 gap-y-0.5 text-xs/4">
              {groupSegments.map((segment, segmentIndex) => {
                const dotColor = groupStripeColorsByLevel[segmentIndex];

                return (
                  <span
                    key={`${segment}-${segmentIndex}`}
                    className="flex items-center gap-0.5"
                  >
                    {dotColor ? (
                      <IconPointFilled
                        className="mt-0.5 size-3 shrink-0 self-baseline"
                        style={{ color: dotColor }}
                        aria-hidden="true"
                      />
                    ) : (
                      <IconPoint
                        className="text-muted-foreground mt-0.5 size-3 shrink-0 self-baseline"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      ref={getGroupLabelRef?.(segmentIndex)}
                      className="min-w-0 break-all"
                    >
                      <HighlightedText
                        text={segment}
                        query={highlightQuery}
                        useCustomHighlight={useCustomHighlight}
                      />
                    </span>
                    {segmentIndex < groupSegments.length - 1 ? (
                      <IconCaretRightFilled
                        className="text-muted-foreground mt-0.5 size-3 shrink-0 self-baseline"
                        aria-hidden="true"
                      />
                    ) : null}
                  </span>
                );
              })}
            </span>
          ) : null}
          <span
            ref={labelRef}
            className="line-clamp-2 block min-h-10 break-all"
          >
            <HighlightedText
              text={pageName}
              query={highlightQuery}
              useCustomHighlight={useCustomHighlight}
            />
          </span>
        </div>
      </ItemTitle>
    </Item>
  );
});

/**
 * Skeleton placeholder for PagesGridItem during loading state
 */
export function PagesGridItemSkeleton({
  className,
  width,
  height,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Item
      variant="muted"
      className={cn("block", className)}
      style={{
        width: width ? `${width}px` : `${DEFAULT_PAGE_CARD_WIDTH}px`,
        height: height
          ? `${height}px`
          : `${DEFAULT_PAGE_CARD_WIDTH * PAGE_CARD_ASPECT_RATIO}px`,
      }}
    >
      <ItemContent className="min-h-0 flex-1 pb-2">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`skeleton-${i}`} className="aspect-square rounded" />
          ))}
        </div>
      </ItemContent>
      <Skeleton className="mb-1 h-3 w-1/2" />
      <Skeleton className="h-5 w-3/4" />
    </Item>
  );
}
