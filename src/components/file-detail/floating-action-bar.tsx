import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";

import type { FileMetadata } from "@/integrations/hydrus-api/models";

import { FileStateBadge } from "@/components/file-detail/file-state-badge";
import { Button } from "@/components/ui-primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { useFileActions } from "@/hooks/use-file-actions";
import { cn } from "@/lib/utils";

interface FloatingActionBarProps {
  data: FileMetadata;
  className?: string;
}

export function FloatingActionBar({ data, className }: FloatingActionBarProps) {
  const actionGroups = useFileActions(data, { includeExternal: true });
  const allActions = actionGroups.flatMap((g) => g.actions);

  // Permanently deleted files have no actions
  const isPermanentlyDeleted = data.is_deleted && !data.is_trashed;

  // Find specific actions for left/right positioning
  const trashAction = allActions.find((a) => a.id === "delete");
  const restoreAction = allActions.find((a) => a.id === "undelete");
  const archiveAction = allActions.find((a) => a.id === "archive");
  const unarchiveAction = allActions.find((a) => a.id === "unarchive");

  // Left action: trash or restore (depending on state)
  const leftAction = isPermanentlyDeleted
    ? null
    : data.is_trashed
      ? restoreAction
      : trashAction;
  // Right action: archive or unarchive (hidden when trashed or permanently deleted)
  const rightAction =
    isPermanentlyDeleted || data.is_trashed
      ? null
      : data.is_inbox
        ? archiveAction
        : unarchiveAction;

  // Overflow: everything except left/right actions (empty when permanently deleted)
  const usedActionIds = new Set(
    [leftAction?.id, rightAction?.id].filter(Boolean),
  );
  const overflowActions = isPermanentlyDeleted
    ? []
    : allActions.filter((a) => !usedActionIds.has(a.id));

  return (
    <div
      className={cn(
        "bg-background/80 fixed right-0 bottom-0 z-40 border-t backdrop-blur-sm",
        "flex items-center justify-between px-4 py-2",
        "transition-[left] duration-200 ease-linear",
        "left-0 md:left-(--sidebar-width) md:group-data-[state=collapsed]/sidebar-wrapper:left-(--sidebar-width-icon)",
        className,
      )}
    >
      {/* Left: Trash/Restore */}
      <div className="flex min-w-0 flex-1 justify-start">
        {leftAction && (
          <Button
            variant="ghost"
            size="sm"
            onClick={leftAction.onClick}
            className={
              leftAction.variant === "destructive"
                ? "text-destructive hover:text-destructive"
                : undefined
            }
          >
            <leftAction.icon className="size-4" />
            <span className="hidden sm:inline">{leftAction.label}</span>
          </Button>
        )}
      </div>

      {/* Center: Status + More */}
      <div className="flex shrink-0 items-center gap-2">
        <FileStateBadge data={data} />

        {overflowActions.length > 0 && (
          <>
            <div className="bg-border h-6 w-px" />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" />}
                nativeButton={false}
              >
                <EllipsisHorizontalIcon className="size-4" />
                <span className="hidden sm:inline">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="center">
                {overflowActions.map((action) => (
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
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Right: Archive/Unarchive */}
      <div className="flex min-w-0 flex-1 justify-end">
        {rightAction && (
          <Button variant="ghost" size="sm" onClick={rightAction.onClick}>
            <rightAction.icon className="size-4" />
            <span className="hidden sm:inline">{rightAction.label}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
