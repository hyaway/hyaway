import {
  ArchiveBoxIcon,
  InboxIcon,
  NoSymbolIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";

import type { FileMetadata } from "@/integrations/hydrus-api/models";

import { Badge } from "@/components/ui-primitives/badge";

type FileStateData = Pick<
  FileMetadata,
  "is_inbox" | "is_trashed" | "is_deleted"
>;

export function FileStateBadge({ data }: { data: FileStateData }) {
  // Permanently deleted (is_deleted but not in trash)
  if (data.is_deleted && !data.is_trashed) {
    return (
      <Badge variant="destructive">
        <NoSymbolIcon className="mr-1 size-3" />
        Permanently deleted
      </Badge>
    );
  }

  if (data.is_trashed) {
    return (
      <Badge variant="destructive">
        <TrashIcon className="mr-1 size-3" />
        Trashed
      </Badge>
    );
  }

  if (data.is_inbox) {
    return (
      <Badge variant="secondary">
        <InboxIcon className="mr-1 size-3" />
        Inbox
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <ArchiveBoxIcon className="mr-1 size-3" />
      Archived
    </Badge>
  );
}
