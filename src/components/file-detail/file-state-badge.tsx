import {
  ArchiveBoxIcon,
  InboxIcon,
  NoSymbolIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";

import type { ComponentProps } from "react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";

import { Badge } from "@/components/ui-primitives/badge";

type FileStateData = Pick<
  FileMetadata,
  "is_inbox" | "is_trashed" | "is_deleted"
>;

type FileStateBadgeProps = Omit<ComponentProps<typeof Badge>, "variant"> & {
  data: FileStateData;
};

export function FileStateBadge({ data, ...badgeProps }: FileStateBadgeProps) {
  // Permanently deleted (is_deleted but not in trash)
  if (data.is_deleted && !data.is_trashed) {
    return (
      <Badge variant="destructive" {...badgeProps}>
        <NoSymbolIcon className="mr-1 size-3" />
        Permanently deleted
      </Badge>
    );
  }

  if (data.is_trashed) {
    return (
      <Badge variant="destructive" {...badgeProps}>
        <TrashIcon className="mr-1 size-3" />
        Trashed
      </Badge>
    );
  }

  if (data.is_inbox) {
    return (
      <Badge variant="secondary" {...badgeProps}>
        <InboxIcon className="mr-1 size-3" />
        Inbox
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" {...badgeProps}>
      <ArchiveBoxIcon className="mr-1 size-3" />
      Archived
    </Badge>
  );
}
