// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import z from "zod";

import {
  PagesGridItem,
  PagesGridItemSkeleton,
} from "./-components/pages-grid-item";
import { PagesIndexRightSidebar } from "./-components/pages-index-right-sidebar";
import { PagesSearchInput } from "./-components/pages-search-input";
import { PagesDisplaySettingsPopover } from "./-components/pages-display-settings-popover";
import { usePageGroupMetaByPageKey } from "./-hooks/use-page-group-meta";
import { usePagesSearchHighlights } from "./-hooks/use-pages-search-highlights";
import { usePageGridLanes } from "./-hooks/use-page-grid-lanes";
import { filterPagesTree } from "./-hooks/use-pages-tree-search";
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
import {
  useGetMediaPagesQuery,
  useGetPagesTreeQuery,
} from "@/integrations/hydrus-api/queries/manage-pages";
import { useLatestOpenedPageMatch } from "@/stores/latest-opened-page-store";
import {
  usePagesCardWidth,
  usePagesExpandCards,
  usePagesHorizontalGap,
  usePagesMaxLanes,
  usePagesMinLanes,
  usePagesShowLatestOpenedPage,
  usePagesShowScrollBadge,
  usePagesVerticalGap,
} from "@/stores/pages-settings-store";

const PagesSearchSchema = z.looseObject({
  q: z.string().optional(),
});

type PagesGridEntry = {
  id: string;
  page: MediaPage;
  isLatestCard: boolean;
};

function createPageGridEntries(
  pages: Array<MediaPage>,
  latestPage: MediaPage | null,
): Array<PagesGridEntry> {
  const entries: Array<PagesGridEntry> = [];

  if (latestPage) {
    entries.push({
      id: `latest-opened-${latestPage.page_key}`,
      page: latestPage,
      isLatestCard: true,
    });
  }

  for (const page of pages) {
    entries.push({
      id: page.page_key,
      page,
      isLatestCard: false,
    });
  }

  return entries;
}

export const Route = createFileRoute("/_auth/(remote-pages)/pages/")({
  validateSearch: (search) => PagesSearchSchema.parse(search),
  component: PagesIndex,
});

/**
 * Pages index component - shows virtualized grid of pages grid items
 */
function PagesIndex() {
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
  const showLatestOpenedPage = usePagesShowLatestOpenedPage();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchQuery = q ?? "";
  const normalizedQuery = searchQuery.trim();

  const { tree: filteredPagesTree } = useMemo(
    () => filterPagesTree(pagesTree ?? null, normalizedQuery),
    [normalizedQuery, pagesTree],
  );

  const matchedPageKeys = useMemo(() => {
    if (!normalizedQuery || !filteredPagesTree) {
      return null;
    }

    const keys = new Set<string>();
    const stack = [filteredPagesTree];

    while (stack.length) {
      const current = stack.pop()!;
      if (current.is_media_page) {
        keys.add(current.page_key);
      } else if (current.pages?.length) {
        current.pages.forEach((child) => stack.push(child));
      }
    }

    return keys;
  }, [filteredPagesTree, normalizedQuery]);

  const filteredPages = useMemo(() => {
    if (!normalizedQuery) {
      return pages;
    }

    if (!matchedPageKeys) {
      return [];
    }

    return pages.filter((page) => matchedPageKeys.has(page.page_key));
  }, [matchedPageKeys, normalizedQuery, pages]);

  const latestPageMatch = useLatestOpenedPageMatch(filteredPages);
  const visibleLatestPage = showLatestOpenedPage ? latestPageMatch : null;

  const gridEntries = useMemo(
    () => createPageGridEntries(filteredPages, visibleLatestPage),
    [filteredPages, visibleLatestPage],
  );

  const groupMetaByPageKey = usePageGroupMetaByPageKey(pagesTree ?? null);

  const { registerLabelRef, supportsCustomHighlight } =
    usePagesSearchHighlights({
      query: normalizedQuery,
      highlightName: "hyaway-pages-search-grid",
    });

  const gridConfig = usePageGridLanes(
    containerRef,
    minLanes,
    maxLanes,
    isPending ? 6 : gridEntries.length,
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
      entries={gridEntries}
      containerRef={containerRef}
      gridConfig={gridConfig}
      highlightQuery={normalizedQuery}
      registerLabelRef={registerLabelRef}
      useCustomHighlight={supportsCustomHighlight}
      groupMetaByPageKey={groupMetaByPageKey}
    />
  );

  return (
    <>
      <div ref={containerRef}>
        <PageHeading title={title} />
        <div className="my-3 max-w-md">
          <PagesSearchInput />
        </div>

        {mainContent}
      </div>
      <PagesIndexRightSidebar
        tree={pagesTree}
        latestPage={visibleLatestPage}
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
  entries,
  containerRef,
  gridConfig,
  highlightQuery,
  registerLabelRef,
  useCustomHighlight,
  groupMetaByPageKey,
}: {
  entries: Array<PagesGridEntry>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  gridConfig: PageGridLanesResult;
  highlightQuery: string;
  registerLabelRef: (key: string) => (node: HTMLSpanElement | null) => void;
  useCustomHighlight: boolean;
  groupMetaByPageKey: Map<
    string,
    { label: string; stripeColorsByLevel: Array<string | null> }
  >;
}) {
  const showScrollBadge = usePagesShowScrollBadge();
  const {
    lanes,
    effectiveCardWidth,
    effectiveCardHeight,
    horizontalGap,
    verticalGap,
  } = gridConfig;
  const getItemKey = useCallback(
    (index: number) => entries[index].id,
    [entries],
  );

  const rowVirtualizer = useWindowVirtualizer({
    count: entries.length,
    getItemKey,
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
      totalItems: entries.length,
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
            const entry = entries[virtualRow.index];
            const page = entry.page;
            const labelKey = entry.isLatestCard
              ? `latest-opened-${page.page_key}`
              : page.page_key;
            const groupMeta = groupMetaByPageKey.get(page.page_key);
            const groupLabel = groupMeta?.label ?? "";
            const groupStripeColorsByLevel =
              groupMeta?.stripeColorsByLevel ?? [];

            return (
              <li
                key={virtualRow.key}
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
                  className={
                    entry.isLatestCard ? "bg-primary/5 shadow-sm" : undefined
                  }
                  badgeLabel={entry.isLatestCard ? "Last opened" : undefined}
                  tabIndex={getTabIndex(virtualRow.index, visibleIndices)}
                  setLinkRef={setLinkRef}
                  onItemFocus={handleItemFocus}
                  labelRef={registerLabelRef(labelKey)}
                  getGroupLabelRef={(segmentIndex) =>
                    registerLabelRef(`${labelKey}-group-${segmentIndex}`)
                  }
                  highlightQuery={highlightQuery}
                  useCustomHighlight={useCustomHighlight}
                  groupLabel={groupLabel}
                  groupStripeColorsByLevel={groupStripeColorsByLevel}
                />
              </li>
            );
          })}
      </ul>
      <ScrollPositionBadge
        current={(lastItemIndex ?? 0) + 1}
        loaded={entries.length}
        total={entries.length}
        isScrolling={rowVirtualizer.isScrolling}
        show={showScrollBadge}
      />
    </div>
  );
}
