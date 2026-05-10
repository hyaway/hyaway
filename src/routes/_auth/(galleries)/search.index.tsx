// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  createFileRoute,
  linkOptions,
  useNavigate,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import z from "zod";
import {
  SearchQueryBuilder,
  queryToHydrusSearch,
} from "./-components/system-predicate-builder";
import { SearchSettingsPopover } from "./-components/search-settings-popover";
import type { SortConfig } from "./-components/system-predicate-builder";
import type { RuleGroupType } from "react-querybuilder";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import { useReviewActions } from "@/hooks/use-review-actions";
import { useSearchFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { OrTagBadge, TagBadgeFromString } from "@/components/tag/tag-badge";

import { useAllowSystemOnlySearch } from "@/stores/search-settings-store";

import { HydrusFileSortType } from "@/integrations/hydrus-api/models";

const ruleSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({
      combinator: z.string(),
      rules: z.array(ruleSchema),
    }),
    z.object({
      field: z.string(),
      operator: z.string(),
      value: z.unknown(),
    }),
  ]),
);

const querySchema = z.object({
  combinator: z.string(),
  rules: z.array(ruleSchema),
});

const SearchParamsSchema = z.object({
  q: querySchema.optional().catch(undefined),
  sortType: z.number().optional().catch(undefined),
  sortAsc: z.boolean().optional().catch(undefined),
});

export const Route = createFileRoute("/_auth/(galleries)/search/")({
  validateSearch: (search) => SearchParamsSchema.parse(search),
  component: SearchIndex,
});

function SearchIndex() {
  const { q, sortType, sortAsc } = Route.useSearch();
  const navigate = useNavigate();
  const [preserveCurrentScroll, setPreserveCurrentScroll] = useState(false);
  const allowSystemOnlySearch = useAllowSystemOnlySearch();

  const searchTags = useMemo(
    () => (q ? queryToHydrusSearch(q as RuleGroupType) : []),
    [q],
  );

  // System-only queries (no tag rules) are gated by the store setting.
  const hasTagRule = useMemo(() => {
    if (!q) return false;
    const query = q as RuleGroupType;
    const check = (rules: RuleGroupType["rules"]): boolean =>
      rules.some((r) => {
        if ("rules" in r) return check(r.rules);
        return r.field === "tag";
      });
    return check(query.rules);
  }, [q]);

  const isSystemOnlyQuery = searchTags.length > 0 && !hasTagRule;

  // Don't send system-only queries unless allowed in settings
  const effectiveTags =
    isSystemOnlyQuery && !allowSystemOnlySearch ? [] : searchTags;

  const searchOptions = useMemo(
    () => ({
      file_sort_type: (sortType ??
        HydrusFileSortType.ImportTime) as HydrusFileSortType,
      file_sort_asc: sortAsc ?? false,
    }),
    [sortType, sortAsc],
  );

  const initialSort: SortConfig | undefined = useMemo(
    () =>
      sortType != null
        ? {
            sortType: sortType as HydrusFileSortType,
            sortAsc: sortAsc ?? false,
          }
        : undefined,
    [sortType, sortAsc],
  );

  const { data, isLoading, isFetching, isError, error } = useSearchFilesQuery(
    effectiveTags,
    searchOptions,
  );
  const queryClient = useQueryClient();

  const fileIds = data?.file_ids ?? [];
  const hasFiles = fileIds.length > 0;
  const reviewActions = useReviewActions({ fileIds });

  const handleSearch = useCallback(
    (query: RuleGroupType, options?: { sort?: SortConfig }) => {
      setPreserveCurrentScroll(true);
      void navigate({
        to: "/search",
        search: {
          q: query,
          sortType: options?.sort?.sortType,
          sortAsc: options?.sort?.sortAsc,
        },
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  const getFileLink: FileLinkBuilder = (fileId) =>
    linkOptions({
      to: "/search/$fileId",
      params: { fileId: String(fileId) },
      search: {
        sortType,
        sortAsc,
      },
    });

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: ["searchFiles"],
        })
      }
    />
  );

  const pageTitle = "Search";

  const title = isLoading
    ? pageTitle
    : isError
      ? pageTitle
      : `${pageTitle} (${data?.file_ids?.length ?? 0} files)`;

  return (
    <>
      <>
        <PageHeading title={title} />
        <div className="flex flex-col gap-2 pb-2">
          <SearchQueryBuilder
            initialQuery={q as RuleGroupType | undefined}
            initialSort={initialSort}
            onSearch={handleSearch}
          />
        </div>
        {searchTags.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-3 pb-3">
            <span className="text-muted-foreground text-sm font-medium">
              Active search
            </span>
            <div className="flex flex-wrap gap-1.5">
              {searchTags.map((entry, i) =>
                Array.isArray(entry) ? (
                  <OrTagBadge key={i} tags={entry} />
                ) : (
                  <TagBadgeFromString key={i} displayTag={entry} />
                ),
              )}
            </div>
          </div>
        )}
        {isLoading && searchTags.length > 0 && <PageLoading title={title} />}
        {isError && (
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while searching."
          />
        )}
        {!isLoading && !isError && hasFiles && (
          <ThumbnailGalleryProvider fileIds={fileIds}>
            <ThumbnailGallery
              fileIds={fileIds}
              getFileLink={getFileLink}
              preserveCurrentScroll={preserveCurrentScroll}
            />
          </ThumbnailGalleryProvider>
        )}
        {!isLoading && !isError && !hasFiles && searchTags.length > 0 && (
          <EmptyState message="No files found for the current search." />
        )}
        {!isLoading && !isError && !hasFiles && searchTags.length === 0 && (
          <EmptyState message="Add filters above and click Search." />
        )}
      </>
      <PageHeaderActions>
        <SearchSettingsPopover />
      </PageHeaderActions>
      <PageFloatingFooter leftContent={refetchButton} actions={reviewActions} />
    </>
  );
}
