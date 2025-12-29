import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageCard, PageCardSkeleton } from "@/components/page-card";
import { EmptyState } from "@/components/page/empty-state";
import { PageError } from "@/components/page/page-error";
import { PageFloatingBar } from "@/components/page/page-floating-bar";
import { PageHeading } from "@/components/page/page-heading";
import { RefetchButton } from "@/components/refetch-button";
import { PagesSettingsPopover } from "@/components/settings/pages-settings-popover";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { usePagesMaxColumns } from "@/lib/ux-settings-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/pages/")({
  component: PagesIndex,
});

/**
 * Pages index component - shows grid of page cards
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

  const title = isPending ? "Pages" : `Pages (${pages.length} pages)`;

  // Use auto-fit with a clever minmax formula:
  // - max(12rem, 100%/N) ensures columns are at least 12rem OR 100%/maxColumns wide
  // - This effectively caps the number of columns at maxColumns on wide screens
  // - For large N (e.g. 30), 100%/N becomes small, so we just get the 12rem minimum
  // - On smaller screens, container queries override with fixed column counts
  // - calc(50% - 0.5rem) accounts for the gap-4 (1rem gap / 2 columns)
  const gridStyle = {
    "--pages-max-columns": pagesMaxColumns,
  } as React.CSSProperties;

  const gridClassName = cn(
    "grid grid-cols-1 gap-4 @xs:grid-cols-2 @lg:grid-cols-[repeat(auto-fill,minmax(12rem,min(calc(50%-0.5rem),calc(100%/var(--pages-max-columns)-1rem))))]",
  );

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
            className={gridClassName}
            style={gridStyle}
            aria-label="Loading pages"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <PageCardSkeleton key={`page-skeleton-${i}`} />
            ))}
          </div>
        ) : isError ? (
          <PageError error={error} fallbackMessage="Failed to load pages" />
        ) : pages.length === 0 ? (
          <EmptyState message="No media pages found. Open some file search pages in Hydrus Client." />
        ) : (
          <div className={gridClassName} style={gridStyle}>
            {pages.map((page) => (
              <PageCard
                key={page.page_key}
                pageKey={page.page_key}
                pageName={page.name}
              />
            ))}
          </div>
        )}
      </div>
      <PageFloatingBar
        leftContent={refetchButton}
        rightContent={<PagesSettingsPopover />}
      />
    </>
  );
}
