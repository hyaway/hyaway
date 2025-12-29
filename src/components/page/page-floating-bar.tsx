import { EllipsisHorizontalIcon } from "@heroicons/react/24/solid";

import type { ComponentType, ReactNode, SVGProps } from "react";

import { FloatingBar } from "@/components/app-shell/floating-bar";
import { Button } from "@/components/ui-primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { Spinner } from "@/components/ui-primitives/spinner";
import { cn } from "@/lib/utils";

export interface FloatingBarAction {
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

interface PageFloatingBarProps {
  /** Actions to display */
  actions?: Array<FloatingBarAction>;
  /** Content to display on the left (e.g., refetch button) */
  leftContent?: ReactNode;
  /** Content to display on the right (e.g., settings popover) */
  rightContent?: ReactNode;
  /** Optional className for the floating bar */
  className?: string;
}

/** Maximum visible action buttons (excluding overflow and settings) */
const MAX_VISIBLE_ACTIONS = 3;

export function PageFloatingBar({
  actions = [],
  leftContent,
  rightContent,
  className,
}: PageFloatingBarProps) {
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
    <FloatingBar className={cn("justify-center gap-1", className)}>
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
              <Button
                variant="ghost"
                size="xl"
                className="relative flex-col items-center gap-1"
              />
            }
          >
            <EllipsisHorizontalIcon className="size-6" />
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
    </FloatingBar>
  );
}

function ActionButton({ action }: { action: FloatingBarAction }) {
  const buttonContent = (
    <>
      {action.isPending ? (
        <Spinner className="size-6" />
      ) : (
        <action.icon className="size-6" />
      )}
      <span className="hidden sm:inline">{action.label}</span>
    </>
  );

  // If action has href, render as link
  if (action.href) {
    return (
      <Button
        variant="ghost"
        size="xl"
        className="relative flex-col items-center gap-1"
        disabled={action.isPending}
        render={
          <a
            href={action.href}
            download={action.download || undefined}
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noopener noreferrer" : undefined}
          />
        }
      >
        {buttonContent}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="xl"
      onClick={action.onClick}
      className="relative flex-col items-center gap-1"
      disabled={action.isPending}
    >
      {buttonContent}
    </Button>
  );
}
