// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute } from "@tanstack/react-router";

import { useCommittedSearchFilesQuery } from "./-hooks/use-committed-search-query";
import { FileDetail } from "@/components/file-detail/file-detail";
import { useFileContextNavigation } from "@/hooks/use-file-context-navigation";
import { PRIMARY_SEARCH_KEY } from "@/stores/search-queries-store";

export const Route = createFileRoute("/_auth/(galleries)/search/$fileId")({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `File ${params.fileId}`,
  }),
});

function RouteComponent() {
  const { fileId } = Route.useParams();
  const fileIdNum = Number(fileId);

  const { data, isLoading, isError } =
    useCommittedSearchFilesQuery(PRIMARY_SEARCH_KEY);

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
