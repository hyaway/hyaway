import { EllipsisVerticalIcon } from "@heroicons/react/16/solid";

import type { FileMetadata } from "@/integrations/hydrus-api/models";

import { Button } from "@/components/ui-primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { FileViewerSettingsPopover } from "@/components/settings/file-viewer-settings-popover";
import { useFileActions } from "@/hooks/use-file-actions";

export function FileActionButtons({ data }: { data: FileMetadata }) {
  const actionGroups = useFileActions(data, { includeExternal: true });

  return (
    <div className="flex flex-row justify-between gap-2">
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" />}
            nativeButton={false}
          >
            <EllipsisVerticalIcon className="size-4" />
            Actions
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {actionGroups.map((group, groupIndex) => (
              <div key={group.id}>
                {groupIndex > 0 && <DropdownMenuSeparator />}
                {group.actions.map((action) => (
                  <DropdownMenuItem
                    key={action.id}
                    onClick={action.onClick}
                    variant={action.variant}
                    render={
                      action.href ? (
                        <a
                          href={action.href}
                          download={action.download || undefined}
                          target={action.external ? "_blank" : undefined}
                          rel={
                            action.external ? "noopener noreferrer" : undefined
                          }
                        />
                      ) : undefined
                    }
                  >
                    <action.icon className="size-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <FileViewerSettingsPopover />
    </div>
  );
}
