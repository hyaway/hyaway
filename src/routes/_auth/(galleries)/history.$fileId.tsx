import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

import { FileDetail } from "@/components/file-detail/file-detail";
import { useFileContextNavigation } from "@/hooks/use-file-context-navigation";
import { useHistoryFileIds } from "@/lib/history-store";

export const Route = createFileRoute("/_auth/(galleries)/history/$fileId")({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `File ${params.fileId}`,
  }),
});

function RouteComponent() {
  const { fileId } = Route.useParams();
  const fileIdNum = Number(fileId);

  // Load the context (list of file IDs in history)
  const fileIds = useHistoryFileIds();

  const buildParams = useCallback(
    (fid: number) => ({ fileId: String(fid) }),
    [],
  );

  const { navActions, shouldFallback } = useFileContextNavigation({
    fileId: fileIdNum,
    fileIds,
    isLoading: false,
    isError: false,
    contextRoute: "/history/$fileId",
    buildParams,
  });

  // While redirecting, show nothing (or could show loading)
  if (shouldFallback) {
    return null;
  }

  return <FileDetail fileId={fileIdNum} prependActions={navActions} />;
}
