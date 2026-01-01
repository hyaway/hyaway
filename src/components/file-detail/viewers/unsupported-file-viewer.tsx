import { IconFileSad } from "@tabler/icons-react";
import { viewerFixedHeight } from "./style-constants";
import { cn } from "@/lib/utils";

interface UnsupportedFileViewerProps {
  fileUrl: string;
  mime: string;
}

export function UnsupportedFileViewer({
  fileUrl,
  mime,
}: UnsupportedFileViewerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded border p-8",
        viewerFixedHeight,
      )}
    >
      <IconFileSad stroke={1.5} className="text-muted-foreground size-12" />
      <p className="text-muted-foreground">
        This file type ({mime}) is not currently viewable inline.
      </p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline"
      >
        Open file in new tab
      </a>
    </div>
  );
}
