// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import z from "zod";

import type { HydrusTagSearch } from "@/integrations/hydrus-api/models";
import { HydrusFileSortType } from "@/integrations/hydrus-api/models";
import { useSearchFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { FileDetail } from "@/components/file-detail/file-detail";
import { useFileContextNavigation } from "@/hooks/use-file-context-navigation";

const SearchParamsSchema = z.object({
  tags: z
    .string()
    .transform((val) => val.split(",").filter(Boolean))
    .or(z.array(z.string()))
    .optional(),
  sortType: z.number().optional().catch(undefined),
  sortAsc: z.boolean().optional().catch(undefined),
});

export const Route = createFileRoute("/_auth/(galleries)/search/$fileId")({
  validateSearch: (search) => SearchParamsSchema.parse(search),
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `File ${params.fileId}`,
  }),
});

function RouteComponent() {
  const { fileId } = Route.useParams();
  const { tags: selectedTags, sortType, sortAsc } = Route.useSearch();
  const fileIdNum = Number(fileId);

  // Tags come directly from URL params (set by the index page's getFileLink)
  const searchTags: HydrusTagSearch = useMemo(
    () => selectedTags ?? [],
    [selectedTags],
  );

  const searchOptions = useMemo(
    () => ({
      file_sort_type: (sortType ??
        HydrusFileSortType.ImportTime) as HydrusFileSortType,
      file_sort_asc: sortAsc ?? false,
    }),
    [sortType, sortAsc],
  );

  const { data, isLoading, isError } = useSearchFilesQuery(
    searchTags,
    searchOptions,
  );

  const fileIds = data?.file_ids;

  const buildParams = (fid: number) => ({ fileId: String(fid) });

  const { navActions, shouldFallback } = useFileContextNavigation({
    fileId: fileIdNum,
    fileIds,
    isLoading,
    isError,
    contextRoute: "/search/$fileId",
    buildParams,
  });

  if (shouldFallback) {
    return null;
  }

  return <FileDetail fileId={fileIdNum} prependActions={navActions} />;
}
