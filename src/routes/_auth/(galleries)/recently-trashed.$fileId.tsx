import { createFileRoute } from "@tanstack/react-router";

import { FileDetail } from "@/components/file-detail/file-detail";
import { useFileContextNavigation } from "@/hooks/use-file-context-navigation";
import { useRecentlyTrashedFilesQuery } from "@/integrations/hydrus-api/queries/search";

export const Route = createFileRoute(
  "/_auth/(galleries)/recently-trashed/$fileId",
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
  const { data, isLoading, isError } = useRecentlyTrashedFilesQuery();

  const fileIds = data?.file_ids;

  const buildParams = (fid: number) => ({ fileId: String(fid) });

  const { navActions, shouldFallback } = useFileContextNavigation({
    fileId: fileIdNum,
    fileIds,
    isLoading,
    isError,
    contextRoute: "/recently-trashed/$fileId",
    buildParams,
  });

  // While redirecting, show nothing (or could show loading)
  if (shouldFallback) {
    return null;
  }

  return <FileDetail fileId={fileIdNum} prependActions={navActions} />;
}
