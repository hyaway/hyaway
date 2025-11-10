import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { Loader } from "@/components/ui/loader";
import { Note } from "@/components/ui/note";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries";

export const Route = createFileRoute("/_auth/pages")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isLoading, isError, error } = useGetMediaPagesQuery();
  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <Note intent="danger">
        {error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching pages."}
        <br />
        {error instanceof AxiosError && error.response?.data?.error && (
          <span>{error.response.data.error}</span>
        )}
      </Note>
    );
  }

  return (
    <div className="p-2">
      <Outlet />
    </div>
  );
}
