import { IconExternalLink } from "@tabler/icons-react";

import type { FileMetadata } from "@/integrations/hydrus-api/models";

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui-primitives/context-menu";
import { useFileActions } from "@/hooks/use-file-actions";

interface ThumbnailGalleryItemContextMenuProps {
  item: Pick<
    FileMetadata,
    | "file_id"
    | "is_inbox"
    | "is_trashed"
    | "is_deleted"
    | "ext"
    | "filetype_human"
    | "mime"
  >;
}

export function ThumbnailGalleryItemContextMenu({
  item,
}: ThumbnailGalleryItemContextMenuProps) {
  const actionGroups = useFileActions(item, {
    includeOpen: true,
    includeExternal: true,
  });

  return (
    <ContextMenuContent
      className={
        "bg-popover/95 supports-backdrop-filter:bg-popover/75 backdrop-blur-sm"
      }
    >
      {actionGroups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 && <ContextMenuSeparator />}
          {group.actions.map((action) => (
            <ContextMenuItem
              key={action.id}
              onClick={action.onClick}
              variant={action.variant}
            >
              <action.icon />
              {action.label}
              {action.external && (
                <IconExternalLink className="ml-auto opacity-50" />
              )}
            </ContextMenuItem>
          ))}
        </div>
      ))}
    </ContextMenuContent>
  );
}
