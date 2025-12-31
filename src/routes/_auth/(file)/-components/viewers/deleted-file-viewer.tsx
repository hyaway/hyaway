import { IconBan } from "@tabler/icons-react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { BlurhashCanvas } from "@/components/blurhash-canvas";

export function DeletedFileViewer({ data }: { data: FileMetadata }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-sm border p-8">
      {data.blurhash && (
        <BlurhashCanvas
          blurhash={data.blurhash}
          width={32}
          height={32}
          className="absolute inset-0 h-full w-full"
        />
      )}
      <div className="relative z-10 flex flex-col items-center gap-4 rounded-sm bg-black/50 p-8 text-white backdrop-blur-xs">
        <IconBan className="size-12" />
        <p>This file has been deleted and is no longer available.</p>
      </div>
    </div>
  );
}
