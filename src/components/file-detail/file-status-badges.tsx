import {
  ArchiveBoxIcon,
  InboxIcon,
  NoSymbolIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";

import { MimeIcon } from "./mime-icon";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Badge } from "@/components/ui-primitives/badge";

export function FileStatusBadges({ data }: { data: FileMetadata }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {data.is_inbox ? (
        <Badge variant="secondary">
          <InboxIcon className="mr-1 size-3" />
          Inbox
        </Badge>
      ) : (
        <Badge variant="secondary">
          <ArchiveBoxIcon className="mr-1 size-3" />
          Archived
        </Badge>
      )}
      {data.is_trashed && (
        <Badge variant="destructive">
          <TrashIcon className="mr-1 size-3" />
          Trashed
        </Badge>
      )}
      {data.is_deleted && !data.is_trashed && (
        <Badge variant="destructive">
          <NoSymbolIcon className="mr-1 size-3" />
          Permanently deleted
        </Badge>
      )}
      <Badge variant="outline">
        <MimeIcon mime={data.mime} className="mr-1 size-3" />
        {data.mime}
      </Badge>
      {data.has_audio && (
        <Badge variant="outline">
          <SpeakerWaveIcon className="mr-1 size-3" /> Has audio
        </Badge>
      )}
    </div>
  );
}
