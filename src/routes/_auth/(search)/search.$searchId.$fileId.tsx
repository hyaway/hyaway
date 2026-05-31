// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute } from "@tanstack/react-router";

import { useCommittedSearchFilesQuery } from "./-hooks/use-committed-search-query";
import { FileDetail } from "@/components/file-detail/file-detail";
import { useFileContextNavigation } from "@/hooks/use-file-context-navigation";
import { getVisibleFileIds } from "@/integrations/hydrus-api/queries/file-metadata-cache";

export const Route = createFileRoute(
  "/_auth/(search)/search/$searchId/$fileId",
)({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `File ${params.fileId}`,
  }),
});

function RouteComponent() {
  const { searchId, fileId } = Route.useParams();
  const fileIdNum = Number(fileId);

  const { data, isLoading, isError } = useCommittedSearchFilesQuery(searchId);

  const fileIds = data
    ? getVisibleFileIds(data.file_ids ?? [], data)
    : undefined;

  const buildParams = (fid: number) => ({
    searchId,
    fileId: String(fid),
  });

  const { navActions, shouldFallback } = useFileContextNavigation({
    fileId: fileIdNum,
    fileIds,
    isLoading,
    isError,
    contextRoute: "/search/$searchId/$fileId",
    buildParams,
  });

  if (shouldFallback) {
    return null;
  }

  return <FileDetail fileId={fileIdNum} prependActions={navActions} />;
}
