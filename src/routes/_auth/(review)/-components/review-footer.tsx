// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import {
  IconArchive,
  IconArrowBackUp,
  IconArrowUp,
  IconDots,
  IconTrash,
} from "@tabler/icons-react";
import { ReviewRatingButton } from "./review-rating-picker";
import type { ReviewAction } from "@/stores/review-queue-store";
import {
  useReviewQueueCurrentFileId,
  useReviewShortcutsEnabled,
} from "@/stores/review-queue-store";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useFileActions } from "@/hooks/use-file-actions";
import { FooterPortal } from "@/components/app-shell/footer-portal";
import {
  BottomNavButton,
  BottomNavButtonProvider,
} from "@/components/ui-primitives/bottom-nav-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";

interface ReviewFooterProps {
  /** Callback when an action button is clicked */
  onAction: (action: ReviewAction | "undo") => void;
  /** Number of actions that can be undone */
  undoCount: number;
  /** Whether the deck is empty/complete */
  disabled?: boolean;
}

export function ReviewFooter({
  onAction,
  undoCount,
  disabled,
}: ReviewFooterProps) {
  const showShortcuts = useReviewShortcutsEnabled();

  // Don't show footer when review is complete
  if (disabled) {
    return null;
  }

  return (
    <FooterPortal>
      <BottomNavButtonProvider maxButtons={6}>
        <div className="flex h-full w-[100cqw] items-center justify-between">
          {/* Left section - Rating */}
          <ReviewRatingButton truncateLabel />

          {/* Center section - Action buttons */}
          <div className="flex h-full items-center justify-center gap-1">
            {/* Undo button */}
            <BottomNavButton
              label="Undo"
              icon={<IconArrowBackUp className="size-6" />}
              onClick={() => onAction("undo")}
              disabled={undoCount === 0}
              kbd={showShortcuts ? "↓" : undefined}
              badge={undoCount > 0 ? undoCount : undefined}
            />

            {/* Trash button */}
            <BottomNavButton
              label="Trash"
              icon={<IconTrash className="size-6" />}
              onClick={() => onAction("trash")}
              intent="destructive"
              kbd={showShortcuts ? "←" : undefined}
            />

            {/* Skip button */}
            <BottomNavButton
              label="Skip"
              icon={<IconArrowUp className="size-6" />}
              onClick={() => onAction("skip")}
              kbd={showShortcuts ? "↑" : undefined}
            />

            {/* Archive button */}
            <BottomNavButton
              label="Archive"
              icon={<IconArchive className="size-6" />}
              onClick={() => onAction("archive")}
              kbd={showShortcuts ? "→" : undefined}
            />
          </div>

          {/* Right section - More actions */}
          <ReviewMoreActionsMenu />
        </div>
      </BottomNavButtonProvider>
    </FooterPortal>
  );
}

function ReviewMoreActionsMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentFileId = useReviewQueueCurrentFileId();
  const { data: metadata } = useGetSingleFileMetadata(currentFileId ?? 0);

  const actionGroups = useFileActions(
    metadata ?? {
      file_id: currentFileId ?? 0,
      is_inbox: false,
      is_trashed: false,
      is_deleted: false,
      ext: "",
      filetype_human: "",
      mime: "",
    },
    {
      includeOpen: true,
      includeExternal: true,
      includeThumbnail: true,
    },
  );

  // Filter to only overflow actions (external links, etc.)
  // Skip management actions since they're already in the main footer
  const overflowGroups = actionGroups.filter(
    (group) => group.id !== "management",
  );

  if (!currentFileId || overflowGroups.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger
        render={
          <BottomNavButton
            label="More"
            icon={<IconDots className="size-6" />}
            data-menu-open={menuOpen}
          />
        }
      />
      <DropdownMenuContent side="top" align="end">
        {overflowGroups.map((group, groupIndex) => (
          <DropdownMenuGroup key={group.id}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            {group.actions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={action.onClick}
                variant={action.variant}
                disabled={action.disabled}
                render={
                  action.href ? (
                    <a
                      href={action.href}
                      download={action.download || undefined}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noopener noreferrer" : undefined}
                    />
                  ) : undefined
                }
              >
                <action.icon />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
