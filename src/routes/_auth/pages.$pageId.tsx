import {
  GridLayout,
  ListBox,
  ListBoxItem,
  ListLayout,
  Size,
  Virtualizer,
} from "react-aria-components";
import { Heading } from "@/components/ui/heading";
import { Loader } from "@/components/ui/loader";
import { Note } from "@/components/ui/note";
import { Separator } from "@/components/ui/separator";
import { useThumbnailFileIdUrl } from "@/hooks/use-url-with-api-key";
import {
  useGetPageInfoQuery,
  useThumbnailDimensions,
} from "@/integrations/hydrus-api/queries";
import { createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";

export const Route = createFileRoute("/_auth/pages/$pageId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { pageId } = Route.useParams();
  const { data, isLoading, isError, error } = useGetPageInfoQuery(pageId, true);

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
    <div>
      <Heading>Page: {data?.page_info.name}</Heading>
      <Separator className="my-2" />
      {data?.page_info.media ? (
        <div>
          <p>Number of files: {data.page_info.media.num_files}</p>
          <div className="flex flex-row flex-wrap gap-x-2 gap-y-2 ps-1">
            {data.page_info.media.hash_ids.map((fileId) => (
              <Thumbnail key={fileId} fileId={fileId} />
            ))}
          </div>
          {/* <ImageGrid fileIds={data.page_info.media.hash_ids} /> */}
        </div>
      ) : (
        <p>This page has no media.</p>
      )}
    </div>
  );
}

function Thumbnail({ fileId }: { fileId: number }) {
  const url = useThumbnailFileIdUrl(fileId);
  const dimensions = useThumbnailDimensions();
  return (
    <div
      style={dimensions}
      className={`overflow-hidden rounded bg-neutral-900`}
    >
      <img
        src={url}
        alt={`Thumbnail for file ID ${fileId}`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

function ImageGrid({ fileIds }: { fileIds: number[] }) {
  const dimensions = useThumbnailDimensions();

  return (
    <Virtualizer
      layout={GridLayout}
      layoutOptions={{
        minItemSize: new Size(dimensions.width, dimensions.height),
        maxItemSize: new Size(dimensions.width * 5, dimensions.height),
        minSpace: new Size(8, 8),
      }}
    >
      <ListBox
        layout="grid"
        aria-label="Virtualized grid layout"
        selectionMode="multiple"
        className="h-full w-full"
      >
        {fileIds.map((fileId) => (
          <ListBoxItem key={fileId}>
            <Thumbnail fileId={fileId} />
          </ListBoxItem>
        ))}
      </ListBox>
    </Virtualizer>
  );
}
