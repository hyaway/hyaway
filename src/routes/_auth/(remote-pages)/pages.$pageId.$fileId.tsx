import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useResolvedPage } from "./-hooks/use-resolved-page";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageHeading } from "@/components/page-shell/page-heading";
import { PageLoading } from "@/components/page-shell/page-loading";
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

  // Memoize redirectParams to avoid infinite loop in useEffect
  const redirectParams = useMemo(() => ({ fileId }), [fileId]);

  const resolved = useResolvedPage({
    pageId,
    redirectTo: "/pages/$pageId/$fileId",
    redirectParams,
  });

  if (resolved.status === "loading") {
    return <PageLoading title="Loading..." />;
  }

  if (resolved.status === "not-found") {
    return (
      <>
        <PageHeading title="Page not found" />
        <EmptyState
          message={`No page found matching "${pageId}". The page may have been closed or Hydrus was restarted.`}
        />
      </>
    );
  }

  return (
    <FileDetailWithContext
      fileId={fileIdNum}
      resolvedPageKey={resolved.page.page_key}
      resolvedPageSlug={resolved.page.slug}
    />
  );
}

function FileDetailWithContext({
  fileId,
  resolvedPageKey,
  resolvedPageSlug,
}: {
  fileId: number;
  resolvedPageKey: string;
  resolvedPageSlug: string;
}) {
  // Load the context (list of file IDs in this page)
  const { data, isLoading, isError } = useGetPageInfoQuery(
    resolvedPageKey,
    true,
  );

  const fileIds = data?.page_info.media.hash_ids;

  const buildParams = (fid: number) => ({
    pageId: resolvedPageSlug,
    fileId: String(fid),
  });

  const { navActions, shouldFallback } = useFileContextNavigation({
    fileId,
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

  return <FileDetail fileId={fileId} prependActions={navActions} />;
}
