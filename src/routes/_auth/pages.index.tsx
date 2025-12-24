import { createFileRoute } from "@tanstack/react-router";
import { PageCard, PageCardSkeleton } from "@/components/page-card";
import { PageError } from "@/components/page-error";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";

export const Route = createFileRoute("/_auth/pages/")({
  component: PagesIndex,
});

/**
 * Pages index component - shows grid of page cards
 */
function PagesIndex() {
  const { data: pages, isPending, isError, error } = useGetMediaPagesQuery();

  return (
    <div className="@container">
      <Heading level={1}>Pages</Heading>

      <Separator className="my-2" />

      {isPending ? (
        <div
          className="grid gap-4 @xs:grid-cols-2 @lg:grid-cols-3 @2xl:grid-cols-[repeat(auto-fill,12rem)]"
          aria-label="Loading pages"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <PageCardSkeleton key={`page-skeleton-${i}`} />
          ))}
        </div>
      ) : isError ? (
        <PageError error={error} fallbackMessage="Failed to load pages" />
      ) : pages.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          No media pages found. Open some file search pages in Hydrus Client.
        </div>
      ) : (
        <div className="grid gap-4 @xs:grid-cols-2 @lg:grid-cols-3 @2xl:grid-cols-[repeat(auto-fill,12rem)]">
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
  );
}
