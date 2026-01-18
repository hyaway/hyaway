// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect, useMemo, useRef } from "react";

import {
  PagesGridItem,
  PagesGridItemSkeleton,
} from "./-components/pages-grid-item";
import { PagesDisplaySettingsPopover } from "./-components/pages-display-settings-popover";
import { usePageGridLanes } from "./-hooks/use-page-grid-lanes";
import type { PageGridLanesResult } from "./-hooks/use-page-grid-lanes";
import type { MediaPage } from "@/integrations/hydrus-api/models";

import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ScrollPositionBadge } from "@/components/scroll-position-badge";
import { useMasonryNavigation } from "@/hooks/use-masonry-navigation";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import {
  usePagesCardWidth,
  usePagesExpandCards,
  usePagesHorizontalGap,
  usePagesMaxLanes,
  usePagesMinLanes,
  usePagesShowScrollBadge,
  usePagesVerticalGap,
} from "@/stores/pages-settings-store";

export const Route = createFileRoute("/_auth/(remote-pages)/pages/")({
  component: PagesIndex,
});

/**
 * Pages index component - shows virtualized grid of pages grid items
 */
function PagesIndex() {
  const {
    data: pages,
    isPending,
    isFetching,
    isError,
    error,
  } = useGetMediaPagesQuery();
  const queryClient = useQueryClient();
  const minLanes = usePagesMinLanes();
  const maxLanes = usePagesMaxLanes();
  const cardWidth = usePagesCardWidth();
  const horizontalGap = usePagesHorizontalGap();
  const verticalGap = usePagesVerticalGap();
  const expandCards = usePagesExpandCards();
  const containerRef = useRef<HTMLDivElement>(null);
  const gridConfig = usePageGridLanes(
    containerRef,
    minLanes,
    maxLanes,
    isPending ? 6 : pages.length,
    { cardWidth, horizontalGap, verticalGap, expandCards },
  );

  const title = isPending ? "Pages" : `Pages (${pages.length} pages)`;

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: ["getPages"],
        })
      }
    />
  );

  return (
    <>
      <div ref={containerRef}>
        <PageHeading title={title} />

        {isPending ? (
          <div
            className="flex flex-wrap"
            style={{ gap: `${verticalGap}px ${horizontalGap}px` }}
            aria-label="Loading pages"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <PagesGridItemSkeleton
                key={`page-skeleton-${i}`}
                width={gridConfig.effectiveCardWidth}
                height={gridConfig.effectiveCardHeight}
              />
            ))}
          </div>
        ) : isError ? (
          <PageError error={error} fallbackMessage="Failed to load pages" />
        ) : pages.length === 0 ? (
          <EmptyState message="No media pages found. Open some file search pages in Hydrus Client." />
        ) : (
          <PagesGrid
            pages={pages}
            containerRef={containerRef}
            gridConfig={gridConfig}
          />
        )}
      </div>
      <PageHeaderActions>
        <PagesDisplaySettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter leftContent={refetchButton} />
    </>
  );
}

function PagesGrid({
  pages,
  containerRef,
  gridConfig,
}: {
  pages: Array<MediaPage>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  gridConfig: PageGridLanesResult;
}) {
  const showScrollBadge = usePagesShowScrollBadge();
  const {
    lanes,
    effectiveCardWidth,
    effectiveCardHeight,
    horizontalGap,
    verticalGap,
  } = gridConfig;

  const rowVirtualizer = useWindowVirtualizer({
    count: pages.length,
    estimateSize: () => effectiveCardHeight,
    overscan: 4,
    gap: verticalGap,
    lanes,
    scrollMargin: containerRef.current?.offsetTop ?? 0,
  });

  // Force remeasurement when card dimensions change
  useLayoutEffect(() => {
    rowVirtualizer.measure();
  }, [effectiveCardHeight, verticalGap, lanes, rowVirtualizer]);

  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastItemIndex = virtualItems.at(-1)?.index;

  const { setLinkRef, handleKeyDown, handleItemFocus, getTabIndex } =
    useMasonryNavigation({
      lanes,
      totalItems: pages.length,
      getVirtualItems: rowVirtualizer.getVirtualItems.bind(rowVirtualizer),
      scrollToIndex: rowVirtualizer.scrollToIndex.bind(rowVirtualizer),
    });

  const visibleIndices = useMemo(
    () => virtualItems.map((v) => v.index),
    [virtualItems],
  );

  return (
    <div className="@container w-full">
      <ul
        role="grid"
        onKeyDown={handleKeyDown}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
        className="relative w-full"
      >
        {lanes > 0 &&
          virtualItems.map((virtualRow) => {
            const page = pages[virtualRow.index];

            return (
              <li
                key={page.page_key}
                className="absolute top-0 left-0"
                style={{
                  width: `${effectiveCardWidth}px`,
                  height: `${effectiveCardHeight}px`,
                  transform: `translate(${virtualRow.lane * (effectiveCardWidth + horizontalGap)}px, ${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                }}
              >
                <PagesGridItem
                  pageKey={page.page_key}
                  pageName={page.name}
                  pageSlug={page.slug}
                  index={virtualRow.index}
                  tabIndex={getTabIndex(virtualRow.index, visibleIndices)}
                  setLinkRef={setLinkRef}
                  onItemFocus={handleItemFocus}
                />
              </li>
            );
          })}
      </ul>
      <ScrollPositionBadge
        current={(lastItemIndex ?? 0) + 1}
        loaded={pages.length}
        total={pages.length}
        isScrolling={rowVirtualizer.isScrolling}
        show={showScrollBadge}
      />
    </div>
  );
}
