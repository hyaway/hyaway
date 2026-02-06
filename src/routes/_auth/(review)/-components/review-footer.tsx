// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import {
  IconArrowBackUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconDots,
} from "@tabler/icons-react";
import { getSwipeBindingDescriptor } from "./review-swipe-descriptors";
import { ReviewRatingButton } from "./review-rating-picker";
import type { Icon } from "@tabler/icons-react";
import type { ReactNode } from "react";
import type {
  ReviewFileAction,
  SwipeDirection,
} from "@/stores/review-settings-store";
import { useReviewQueueCurrentFileId } from "@/stores/review-queue-store";
import {
  useReviewShortcutsEnabled,
  useReviewSwipeBindings,
} from "@/stores/review-settings-store";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
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

/** Arrow icons for each swipe direction */
const DIRECTION_ICONS: Record<SwipeDirection, Icon> = {
  left: IconArrowLeft,
  right: IconArrowRight,
  up: IconArrowUp,
  down: IconArrowDown,
};

/** Combines a direction arrow with an action icon (half and half size) */
function DirectionalIcon({
  direction,
  children,
}: {
  direction: SwipeDirection;
  children: ReactNode;
}) {
  const ArrowIcon = DIRECTION_ICONS[direction];
  return (
    <span className="flex max-w-5 items-center justify-center -space-x-1 overflow-visible">
      <span className="hidden @xs:inline [&>svg]:size-5">{children}</span>
      <ArrowIcon className="size-5 shrink-0" />
    </span>
  );
}

interface ReviewFooterProps {
  /** Callback to perform swipe action in a direction */
  onSwipe: (direction: SwipeDirection) => void;
  /** Callback to undo last action */
  onUndo: () => void;
  /** Number of actions that can be undone */
  undoCount: number;
  /** Whether the deck is empty/complete */
  disabled?: boolean;
}

export function ReviewFooter({
  onSwipe,
  onUndo,
  undoCount,
  disabled,
}: ReviewFooterProps) {
  const showShortcuts = useReviewShortcutsEnabled();
  const bindings = useReviewSwipeBindings();
  const { servicesMap } = useRatingServices();

  // Don't show footer when review is complete
  if (disabled) {
    return null;
  }

  // Get icons for action directions (using descriptors for icons but not labels)
  const leftDescriptor = getSwipeBindingDescriptor(bindings.left, servicesMap);
  const upDescriptor = getSwipeBindingDescriptor(bindings.up, servicesMap);
  const rightDescriptor = getSwipeBindingDescriptor(
    bindings.right,
    servicesMap,
  );
  const downDescriptor = getSwipeBindingDescriptor(bindings.down, servicesMap);

  // Get file action label (simple capitalized text)
  const getFileActionLabel = (fileAction: ReviewFileAction) => {
    return fileAction.charAt(0).toUpperCase() + fileAction.slice(1);
  };

  // Determine button intent based on file action
  const getIntent = (fileAction: ReviewFileAction) => {
    if (fileAction === "trash") return "destructive" as const;
    return undefined;
  };

  return (
    <FooterPortal>
      <BottomNavButtonProvider maxButtons={7}>
        <div className="flex h-full w-[100cqw] items-center justify-between">
          {/* Left section - Rating */}
          <ReviewRatingButton truncateLabel />

          {/* Center section - Action buttons */}
          <div className="flex h-full items-center justify-center gap-1">
            {/* Undo button */}
            <BottomNavButton
              label="Undo"
              icon={<IconArrowBackUp className="size-6" />}
              onClick={onUndo}
              disabled={undoCount === 0}
              kbd={showShortcuts ? "Z" : undefined}
              badge={undoCount > 0 ? undoCount : undefined}
            />

            {/* Left direction button */}
            <BottomNavButton
              label={getFileActionLabel(bindings.left.fileAction)}
              customContent={
                <DirectionalIcon direction="left">
                  <leftDescriptor.icon className="size-6" />
                </DirectionalIcon>
              }
              onClick={() => onSwipe("left")}
              intent={getIntent(bindings.left.fileAction)}
            />

            {/* Up direction button */}
            <BottomNavButton
              label={getFileActionLabel(bindings.up.fileAction)}
              customContent={
                <DirectionalIcon direction="up">
                  <upDescriptor.icon className="size-6" />
                </DirectionalIcon>
              }
              onClick={() => onSwipe("up")}
              intent={getIntent(bindings.up.fileAction)}
            />

            {/* Down direction button */}
            <BottomNavButton
              label={getFileActionLabel(bindings.down.fileAction)}
              customContent={
                <DirectionalIcon direction="down">
                  <downDescriptor.icon className="size-6" />
                </DirectionalIcon>
              }
              onClick={() => onSwipe("down")}
              intent={getIntent(bindings.down.fileAction)}
            />

            {/* Right direction button */}
            <BottomNavButton
              label={getFileActionLabel(bindings.right.fileAction)}
              customContent={
                <DirectionalIcon direction="right">
                  <rightDescriptor.icon className="size-6" />
                </DirectionalIcon>
              }
              onClick={() => onSwipe("right")}
              intent={getIntent(bindings.right.fileAction)}
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
