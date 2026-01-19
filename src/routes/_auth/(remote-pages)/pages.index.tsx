// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect, useMemo, useRef } from "react";
import z from "zod";

import {
  PagesGridItem,
  PagesGridItemSkeleton,
} from "./-components/pages-grid-item";
import { PagesIndexRightSidebar } from "./-components/pages-index-right-sidebar";
import { PagesDisplaySettingsPopover } from "./-components/pages-display-settings-popover";
import { usePagesSearchHighlights } from "./-hooks/use-pages-search-highlights";
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
import { Input } from "@/components/ui-primitives/input";
import { useMasonryNavigation } from "@/hooks/use-masonry-navigation";
import {
  useGetMediaPagesQuery,
  useGetPagesTreeQuery,
} from "@/integrations/hydrus-api/queries/manage-pages";
import {
  usePagesCardWidth,
  usePagesExpandCards,
  usePagesHorizontalGap,
  usePagesMaxLanes,
  usePagesMinLanes,
  usePagesShowScrollBadge,
  usePagesVerticalGap,
} from "@/stores/pages-settings-store";

const PagesSearchSchema = z.object({
  q: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
});

export const Route = createFileRoute("/_auth/(remote-pages)/pages/")({
  validateSearch: (search) => PagesSearchSchema.parse(search),
  component: PagesIndex,
});

/**
 * Pages index component - shows virtualized grid of pages grid items
 */
function PagesIndex() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { q } = Route.useSearch();
  const {
    data: pages,
    isPending,
    isFetching,
    isError,
    error,
  } = useGetMediaPagesQuery();
  const { data: pagesTree } = useGetPagesTreeQuery();
  const queryClient = useQueryClient();
  const minLanes = usePagesMinLanes();
  const maxLanes = usePagesMaxLanes();
  const cardWidth = usePagesCardWidth();
  const horizontalGap = usePagesHorizontalGap();
  const verticalGap = usePagesVerticalGap();
  const expandCards = usePagesExpandCards();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchQuery = q ?? "";
  const normalizedQuery = searchQuery.trim();

  const filteredPages = useMemo(() => {
    if (!normalizedQuery) {
      return pages;
    }

    const lowerQuery = normalizedQuery.toLowerCase();
    return pages.filter((page) => page.name.toLowerCase().includes(lowerQuery));
  }, [normalizedQuery, pages]);

  const { registerLabelRef, supportsCustomHighlight } =
    usePagesSearchHighlights({
      query: normalizedQuery,
      highlightName: "hyaway-pages-search-grid",
    });

  const gridConfig = usePageGridLanes(
    containerRef,
    minLanes,
    maxLanes,
    isPending ? 6 : filteredPages.length,
    { cardWidth, horizontalGap, verticalGap, expandCards },
  );

  const totalPagesLabel = `${pages.length} ${pages.length === 1 ? "page" : "pages"}`;
  const filteredPagesLabel = `${filteredPages.length} ${filteredPages.length === 1 ? "page" : "pages"}`;
  const title = isPending
    ? "Pages"
    : normalizedQuery && filteredPages.length !== pages.length
      ? `Pages (${filteredPagesLabel} of ${totalPagesLabel})`
      : `Pages (${totalPagesLabel})`;

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

  const handleQueryChange = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        q: value.trim() ? value : undefined,
      }),
      replace: true,
    });
  };

  const emptySearchMessage = "No pages match your search.";
  const emptyPagesMessage =
    "No media pages found. Open some file search pages in Hydrus Client.";
  const treeSidebarEmptyMessage = isPending
    ? "Loading pages..."
    : normalizedQuery
      ? emptySearchMessage
      : "No pages found.";

  const mainContent = isPending ? (
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
    <EmptyState message={emptyPagesMessage} />
  ) : filteredPages.length === 0 ? (
    <EmptyState message={emptySearchMessage} />
  ) : (
    <PagesGrid
      pages={filteredPages}
      containerRef={containerRef}
      gridConfig={gridConfig}
      highlightQuery={normalizedQuery}
      registerLabelRef={registerLabelRef}
      useCustomHighlight={supportsCustomHighlight}
    />
  );

  return (
    <>
      <div ref={containerRef}>
        <PageHeading title={title} />
        <div className="my-3 max-w-md">
          <Input
            placeholder="Search pages"
            value={searchQuery}
            onChange={(event) => handleQueryChange(event.target.value)}
          />
        </div>

        {mainContent}
      </div>
      <PagesIndexRightSidebar
        query={searchQuery}
        onQueryChange={handleQueryChange}
        tree={pagesTree}
        treeEmptyMessage={treeSidebarEmptyMessage}
      />
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
  highlightQuery,
  registerLabelRef,
  useCustomHighlight,
}: {
  pages: Array<MediaPage>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  gridConfig: PageGridLanesResult;
  highlightQuery: string;
  registerLabelRef: (key: string) => (node: HTMLSpanElement | null) => void;
  useCustomHighlight: boolean;
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
                  labelRef={registerLabelRef(page.page_key)}
                  highlightQuery={highlightQuery}
                  useCustomHighlight={useCustomHighlight}
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
