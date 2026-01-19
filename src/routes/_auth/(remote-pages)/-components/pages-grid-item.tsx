// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Link } from "@tanstack/react-router";
import { IconPointFilled } from "@tabler/icons-react";
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
          ref={(el) => setLinkRef?.(el, index)}
          to="/pages/$pageId"
          params={{ pageId: linkPageId }}
          aria-label={`View page "${pageName}" with ${totalFiles} ${totalFiles === 1 ? "file" : "files"}`}
          tabIndex={tabIndex}
          onFocus={() => onItemFocus?.(index)}
        />
      }
      className={cn("relative block h-full", className)}
    >
      {activeStripeColors.length > 0 ? (
        <div className="absolute inset-x-2 bottom-0 flex gap-1">
          {activeStripeColors.map((color, colorIndex) => (
            <span
              key={`${color}-${colorIndex}`}
              className="h-1 w-full rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      ) : null}
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
      <ItemTitle className="line-clamp-2 w-full text-sm/5 wrap-break-word">
        {groupLabel ? (
          <span className="text-muted-foreground mb-0.5 flex flex-wrap items-center gap-x-0.5 gap-y-0.5 text-xs/4">
            {groupSegments.map((segment, segmentIndex) => {
              const dotColor = groupStripeColorsByLevel[segmentIndex];

              return (
                <span
                  key={`${segment}-${segmentIndex}`}
                  className="flex items-center gap-0.5"
                >
                  {dotColor ? (
                    <IconPointFilled
                      className="size-3 shrink-0"
                      style={{ color: dotColor }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span ref={getGroupLabelRef?.(segmentIndex)}>
                    <HighlightedText
                      text={segment}
                      query={highlightQuery}
                      useCustomHighlight={useCustomHighlight}
                    />
                  </span>
                  {segmentIndex < groupSegments.length - 1 ? (
                    <span aria-hidden="true">/</span>
                  ) : null}
                </span>
              );
            })}
          </span>
        ) : null}
        <span ref={labelRef} className="block">
          <HighlightedText
            text={pageName}
            query={highlightQuery}
            useCustomHighlight={useCustomHighlight}
          />
        </span>
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
      <ItemContent className="mb-3.5">
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
