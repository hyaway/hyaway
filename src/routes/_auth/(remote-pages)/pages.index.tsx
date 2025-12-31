import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useRef } from "react";

import { PageCard, PageCardSkeleton } from "./-components/page-card";
import { PagesDisplaySettingsPopover } from "./-components/pages-display-settings-popover";
import type { Page } from "@/integrations/hydrus-api/models";

import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingBar } from "@/components/page-shell/page-floating-bar";
import { PageHeading } from "@/components/page-shell/page-heading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { useMasonryNavigation } from "@/hooks/use-masonry-navigation";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { usePagesMaxColumns } from "@/lib/ux-settings-store";

export const Route = createFileRoute("/_auth/(remote-pages)/pages/")({
  component: PagesIndex,
});

const PAGE_CARD_MIN_WIDTH = 192; // 12rem
const PAGE_CARD_GAP = 16; // gap-4

/**
 * Pages index component - shows virtualized grid of page cards
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
      <div className="@container pb-16">
        <PageHeading title={title} />

        {isPending ? (
          <div
            className="grid grid-cols-1 gap-4 @xs:grid-cols-2 @lg:grid-cols-3"
            aria-label="Loading pages"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <PageCardSkeleton key={`page-skeleton-${i}`} />
            ))}
          </div>
        ) : isError ? (
          <PageError error={error} fallbackMessage="Failed to load pages" />
        ) : pages.length === 0 ? (
          <EmptyState message="No media pages found. Open some file search pages in Hydrus Client." />
        ) : (
          <PagesGrid pages={pages} />
        )}
      </div>
      <PageFloatingBar
        leftContent={refetchButton}
        rightContent={<PagesDisplaySettingsPopover />}
      />
    </>
  );
}

function PagesGrid({ pages }: { pages: Array<Page & { id: string }> }) {
  const pagesMaxColumns = usePagesMaxColumns();
  const parentRef = useRef<HTMLDivElement>(null);
  const [lanes, setLanes] = React.useState(1);

  // Calculate lanes based on container width
  React.useLayoutEffect(() => {
    if (!parentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const containerWidth = entries[0].contentRect.width;
      const calculatedLanes = Math.max(
        1,
        Math.floor(
          (containerWidth + PAGE_CARD_GAP) /
            (PAGE_CARD_MIN_WIDTH + PAGE_CARD_GAP),
        ),
      );
      setLanes(Math.min(calculatedLanes, pagesMaxColumns, pages.length));
    });

    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, [pagesMaxColumns, pages.length]);

  // Fixed card dimensions
  const cardWidth = PAGE_CARD_MIN_WIDTH;
  const cardHeight = PAGE_CARD_MIN_WIDTH + 48;

  const rowVirtualizer = useWindowVirtualizer({
    count: pages.length,
    estimateSize: () => cardHeight,
    overscan: 4,
    gap: PAGE_CARD_GAP,
    lanes,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

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
    <div ref={parentRef} className="w-full">
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
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  transform: `translate(${virtualRow.lane * (cardWidth + PAGE_CARD_GAP)}px, ${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                }}
              >
                <PageCard
                  pageKey={page.page_key}
                  pageName={page.name}
                  tabIndex={getTabIndex(virtualRow.index, visibleIndices)}
                  linkRef={setLinkRef(virtualRow.index)}
                  onFocus={() => handleItemFocus(virtualRow.index)}
                />
              </li>
            );
          })}
      </ul>
    </div>
  );
}
