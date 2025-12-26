import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/16/solid";

import { Button } from "@/components/ui-primitives/button";
import {
  useDownloadFileIdUrl,
  useFullFileIdUrl,
} from "@/hooks/use-url-with-api-key";
import { FileViewerSettingsPopover } from "@/components/settings/file-viewer-settings-popover";

export function FileActionButtons({ fileId }: { fileId: number }) {
  const fileUrl = useFullFileIdUrl(fileId);
  const downloadUrl = useDownloadFileIdUrl(fileId);

  return (
    <div className="flex flex-wrap gap-2">
      <Button render={<a href={downloadUrl} download />} nativeButton={false}>
        <ArrowDownTrayIcon className="mr-1 size-4" />
        Download
      </Button>
      <Button
        render={<a href={fileUrl} target="_blank" rel="noopener noreferrer" />}
        nativeButton={false}
      >
        <ArrowTopRightOnSquareIcon className="mr-1 size-4" />
        Open in new tab
      </Button>
      <FileViewerSettingsPopover className="ms-auto" />
    </div>
  );
}
