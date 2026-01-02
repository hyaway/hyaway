import { createFileRoute } from "@tanstack/react-router";

import { FileDetail } from "@/components/file-detail/file-detail";
import { useFileContextNavigation } from "@/hooks/use-file-context-navigation";
import { useGetPageInfoQuery } from "@/integrations/hydrus-api/queries/manage-pages";

export const Route = createFileRoute(
  "/_auth/(remote-pages)/pages/$pageId/$fileId",
)({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `File ${params.fileId}`,
  }),
});

function RouteComponent() {
  const { pageId, fileId } = Route.useParams();
  const fileIdNum = Number(fileId);

  // Load the context (list of file IDs in this page)
  const { data, isLoading, isError } = useGetPageInfoQuery(pageId, true);

  const fileIds = data?.page_info.media.hash_ids;

  const buildParams = (fid: number) => ({ pageId, fileId: String(fid) });

  const { navActions, shouldFallback } = useFileContextNavigation({
    fileId: fileIdNum,
    fileIds,
    isLoading,
    isError,
    contextRoute: "/pages/$pageId/$fileId",
    buildParams,
  });

  // While redirecting, show nothing (or could show loading)
  if (shouldFallback) {
    return null;
  }

  return <FileDetail fileId={fileIdNum} prependActions={navActions} />;
}
