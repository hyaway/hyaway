import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import { FileDetail } from "@/components/file-detail/file-detail";
import { useFileContextNavigation } from "@/hooks/use-file-context-navigation";
import { useRecentlyInboxedFilesQuery } from "@/integrations/hydrus-api/queries/search";

export const Route = createFileRoute(
  "/_auth/(galleries)/recently-inboxed/$fileId",
)({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `File ${params.fileId}`,
  }),
});

function RouteComponent() {
  const { fileId } = Route.useParams();
  const fileIdNum = Number(fileId);

  // Load the context (list of file IDs in this gallery)
  const { data, isLoading, isError } = useRecentlyInboxedFilesQuery();

  const fileIds = useMemo(() => data?.file_ids, [data]);

  const buildParams = useCallback(
    (fid: number) => ({ fileId: String(fid) }),
    [],
  );

  const { navActions, shouldFallback } = useFileContextNavigation({
    fileId: fileIdNum,
    fileIds,
    isLoading,
    isError,
    contextRoute: "/recently-inboxed/$fileId",
    buildParams,
  });

  // While redirecting, show nothing (or could show loading)
  if (shouldFallback) {
    return null;
  }

  return <FileDetail fileId={fileIdNum} prependActions={navActions} />;
}
