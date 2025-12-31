import { IconDots } from "@tabler/icons-react";

import type { ComponentType, ReactNode, SVGProps } from "react";

import { FloatingFooter } from "@/components/app-shell/floating-footer";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface FloatingFooterAction {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  variant?: "default" | "destructive";
  href?: string;
  download?: boolean;
  external?: boolean;
  isPending?: boolean;
  /** If true, this action will always be in the overflow menu */
  overflowOnly?: boolean;
}

interface PageFloatingFooterProps {
  /** Actions to display */
  actions?: Array<FloatingFooterAction>;
  /** Content to display on the left (e.g., refetch button) */
  leftContent?: ReactNode;
  /** Content to display on the right (e.g., settings popover) */
  rightContent?: ReactNode;
  /** Optional className for the floating footer */
  className?: string;
}

/** Maximum visible action buttons (excluding overflow and settings) */
const MAX_VISIBLE_ACTIONS = 2;

export function PageFloatingFooter({
  actions = [],
  leftContent,
  rightContent,
  className,
}: PageFloatingFooterProps) {
  // Separate actions into always-overflow and normal actions
  const alwaysOverflowActions = actions.filter((a) => a.overflowOnly);
  const normalActions = actions.filter((a) => !a.overflowOnly);

  // Split normal actions into visible and overflow
  const visibleActions = normalActions.slice(0, MAX_VISIBLE_ACTIONS);
  const overflowFromNormal = normalActions.slice(MAX_VISIBLE_ACTIONS);

  // Combine overflow actions: normal overflow first, then always-overflow
  const overflowActions = [...overflowFromNormal, ...alwaysOverflowActions];
  const hasOverflow = overflowActions.length > 0;

  return (
    <FloatingFooter className={cn("justify-center gap-1", className)}>
      {/* Left content (e.g., refetch button) */}
      {leftContent}
      {/* Visible actions */}
      {visibleActions.map((action) => (
        <ActionButton key={action.id} action={action} />
      ))}

      {/* Overflow menu */}
      {hasOverflow && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <BottomNavButton
                label="More"
                icon={<IconDots className="size-6" />}
              />
            }
          />
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
                      rel={action.external ? "noopener noreferrer" : undefined}
                    />
                  ) : undefined
                }
              >
                <action.icon />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Settings (popover or other content) */}
      {rightContent}
    </FloatingFooter>
  );
}

function ActionButton({ action }: { action: FloatingFooterAction }) {
  return (
    <BottomNavButton
      label={action.label}
      icon={<action.icon className="size-6" />}
      onClick={action.onClick}
      isLoading={action.isPending}
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
    />
  );
}
