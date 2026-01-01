import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";

import { PageCard, PageCardSkeleton } from "./-components/page-card";
import { PagesDisplaySettingsPopover } from "./-components/pages-display-settings-popover";
import {
  PAGE_CARD_GAP,
  PAGE_CARD_HEIGHT,
  PAGE_CARD_WIDTH,
  usePageGridLanes,
} from "./-hooks/use-page-grid-lanes";
import type { Page } from "@/integrations/hydrus-api/models";

import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeading } from "@/components/page-shell/page-heading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { useMasonryNavigation } from "@/hooks/use-masonry-navigation";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { usePagesMaxColumns } from "@/lib/ux-settings-store";

export const Route = createFileRoute("/_auth/(remote-pages)/pages/")({
  component: PagesIndex,
});

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
  const pagesMaxColumns = usePagesMaxColumns();
  const containerRef = useRef<HTMLDivElement>(null);
  const lanes = usePageGridLanes(
    containerRef,
    pagesMaxColumns,
    isPending ? 6 : pages.length,
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
      <div ref={containerRef} className="pb-16">
        <PageHeading title={title} />

        {isPending ? (
          <div className="flex flex-wrap gap-4" aria-label="Loading pages">
            {Array.from({ length: 6 }).map((_, i) => (
              <PageCardSkeleton key={`page-skeleton-${i}`} />
            ))}
          </div>
        ) : isError ? (
          <PageError error={error} fallbackMessage="Failed to load pages" />
        ) : pages.length === 0 ? (
          <EmptyState message="No media pages found. Open some file search pages in Hydrus Client." />
        ) : (
          <PagesGrid pages={pages} containerRef={containerRef} lanes={lanes} />
        )}
      </div>
      <PageFloatingFooter
        leftContent={refetchButton}
        rightContent={<PagesDisplaySettingsPopover />}
      />
    </>
  );
}

function PagesGrid({
  pages,
  containerRef,
  lanes,
}: {
  pages: Array<Page & { id: string }>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  lanes: number;
}) {
  const rowVirtualizer = useWindowVirtualizer({
    count: pages.length,
    estimateSize: () => PAGE_CARD_HEIGHT,
    overscan: 4,
    gap: PAGE_CARD_GAP,
    lanes,
    scrollMargin: containerRef.current?.offsetTop ?? 0,
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
    <div className="w-full">
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
                  width: `${PAGE_CARD_WIDTH}px`,
                  height: `${PAGE_CARD_HEIGHT}px`,
                  transform: `translate(${virtualRow.lane * (PAGE_CARD_WIDTH + PAGE_CARD_GAP)}px, ${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
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
