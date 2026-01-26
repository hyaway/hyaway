// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { cva } from "class-variance-authority";
import { createContext, forwardRef, useContext } from "react";
import type { ReactElement, ReactNode } from "react";
import { Badge } from "@/components/ui-primitives/badge";
import { Button } from "@/components/ui-primitives/button";
import { Kbd } from "@/components/ui-primitives/kbd";
import { Spinner } from "@/components/ui-primitives/spinner";
import { cn } from "@/lib/utils";

/**
 * Max buttons configuration for responsive behavior.
 * - 4: Default, labels at @xl
 * - 5: Labels at @2xl
 * - 6: Labels at @3xl, tighter mobile padding, extra tight under 250px
 */
export type BottomNavButtonMaxButtons = 4 | 5 | 6;

/**
 * Context for setting maxButtons for all BottomNavButton descendants.
 */
const BottomNavButtonContext = createContext<BottomNavButtonMaxButtons>(4);

/**
 * Provider to configure all BottomNavButton descendants based on button count.
 * @example
 * <BottomNavButtonProvider maxButtons={6}>
 *   <BottomNavButton label="Action" icon={...} />
 * </BottomNavButtonProvider>
 */
export function BottomNavButtonProvider({
  maxButtons,
  children,
}: {
  maxButtons: BottomNavButtonMaxButtons;
  children: ReactNode;
}) {
  return (
    <BottomNavButtonContext.Provider value={maxButtons}>
      {children}
    </BottomNavButtonContext.Provider>
  );
}

/**
 * Button layout variants based on maxButtons.
 * Controls when to switch from vertical (mobile) to horizontal (desktop) layout.
 */
const bottomNavButtonVariants = cva(
  [
    "h-full flex-col items-center justify-center gap-0.5 border-none",
    "short:gap-0",
    "transition-[gap,padding] duration-200",
  ],
  {
    variants: {
      maxButtons: {
        // 4 buttons: default behavior, labels at @xl
        4: [
          "px-3 short:px-3 max-[150px]:px-0",
          "@xl:flex-row @xl:gap-1.5 @xl:px-4",
          "short:@xl:flex-row short:@xl:gap-1.5 short:@xl:px-4",
        ],
        // 5 buttons: labels at @2xl
        5: [
          "px-2.5 short:px-2.5 max-[200px]:px-0",
          "@2xl:flex-row @2xl:gap-1.5 @2xl:px-4",
          "short:@2xl:flex-row short:@2xl:gap-1.5 short:@2xl:px-4",
        ],
        // 6 buttons: labels at @3xl, tighter mobile padding, extra tight under 250px
        6: [
          "px-2 short:px-2 max-[250px]:px-0",
          "@3xl:flex-row @3xl:gap-1.5 @3xl:px-4",
          "short:@3xl:flex-row short:@3xl:gap-1.5 short:@3xl:px-4",
        ],
      },
      intent: {
        default: "",
        destructive: "text-destructive hover:text-destructive",
      },
    },
    defaultVariants: {
      maxButtons: 4,
      intent: "default",
    },
  },
);

/**
 * Label visibility variants based on maxButtons.
 * Controls when labels become visible and truncation behavior.
 */
const labelVariants = cva(["text-xs"], {
  variants: {
    maxButtons: {
      // 4: show labels, hide in short mode until @xl
      4: "max-[250px]:sr-only short:sr-only short:@xl:not-sr-only @xl:text-sm",
      // 5: show labels, hide in short mode until @2xl
      5: "max-[300px]:sr-only short:sr-only short:@2xl:not-sr-only @2xl:text-sm",
      // 6: show labels, hide at narrow widths, desktop at @3xl
      6: "max-[360px]:sr-only short:sr-only short:@3xl:not-sr-only @3xl:text-sm",
    },
    truncateLabel: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      maxButtons: 4,
      truncateLabel: true,
      className:
        "short:@xl:max-w-[10ch] short:@xl:truncate max-w-[10ch] truncate",
    },
    {
      maxButtons: 5,
      truncateLabel: true,
      className:
        "short:@2xl:max-w-[10ch] short:@2xl:truncate max-w-[10ch] truncate",
    },
    {
      maxButtons: 6,
      truncateLabel: true,
      className:
        "short:@3xl:max-w-[10ch] short:@3xl:truncate max-w-[10ch] truncate",
    },
  ],
  defaultVariants: {
    maxButtons: 4,
    truncateLabel: false,
  },
});

/**
 * Kbd visibility variants based on maxButtons.
 */
const kbdVariants = cva(["hidden"], {
  variants: {
    maxButtons: {
      4: "@xl:inline-flex short:@xl:inline-flex",
      5: "@2xl:inline-flex short:@2xl:inline-flex",
      6: "@3xl:inline-flex short:@3xl:inline-flex",
    },
  },
  defaultVariants: {
    maxButtons: 4,
  },
});

/**
 * Flex layout for label + kbd based on maxButtons.
 */
const labelFlexVariants = cva(["flex flex-col items-center gap-0.5"], {
  variants: {
    maxButtons: {
      4: "@xl:flex-row @xl:gap-1.5 short:@xl:flex-row short:@xl:gap-1.5",
      5: "@2xl:flex-row @2xl:gap-1.5 short:@2xl:flex-row short:@2xl:gap-1.5",
      6: "@3xl:flex-row @3xl:gap-1.5 short:@3xl:flex-row short:@3xl:gap-1.5",
    },
  },
  defaultVariants: {
    maxButtons: 4,
  },
});

interface BottomNavButtonProps {
  /** The label for the button */
  label: string;
  /** Icon content to display */
  icon?: ReactNode;
  /**
   * Custom content to display instead of icon.
   * Use for non-icon displays like text/numbers.
   */
  customContent?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Context menu handler (right-click / long-press) */
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Visual style variant */
  intent?: "default" | "destructive";
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional className */
  className?: string;
  /** Custom render element (e.g., anchor tag for links) */
  render?: ReactElement;
  /** Data attribute for menu open state */
  "data-menu-open"?: boolean;
  /** Badge number to display on icon */
  badge?: number;
  /** Keyboard shortcut hint */
  kbd?: string;
  /** Truncate label at max characters */
  truncateLabel?: boolean;
}

export const BottomNavButton = forwardRef<
  HTMLButtonElement,
  BottomNavButtonProps
>(function BottomNavButton(
  {
    label,
    icon,
    customContent,
    onClick,
    onContextMenu,
    intent,
    isLoading,
    disabled,
    className,
    render,
    "data-menu-open": dataMenuOpen,
    badge,
    kbd,
    truncateLabel,
  },
  ref,
) {
  const maxButtons = useContext(BottomNavButtonContext);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="xl"
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(bottomNavButtonVariants({ maxButtons, intent }), className)}
      disabled={disabled || isLoading}
      render={render}
      data-menu-open={dataMenuOpen || undefined}
    >
      {isLoading ? (
        <Spinner className="short:size-5 size-6" />
      ) : (
        <span
          className={cn(
            "short:[&>svg]:size-5 relative flex items-center justify-center [&>svg]:size-6",
            customContent ? "short:h-5 h-6" : "short:size-5 size-6",
          )}
        >
          {customContent ?? icon}
          {badge !== undefined && badge > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center px-1 text-[10px]"
            >
              {badge > 99 ? "99+" : badge}
            </Badge>
          )}
        </span>
      )}
      <span
        className={cn(
          labelVariants({ maxButtons, truncateLabel }),
          kbd && labelFlexVariants({ maxButtons }),
        )}
      >
        {label}
        {kbd && <Kbd className={kbdVariants({ maxButtons })}>{kbd}</Kbd>}
      </span>
    </Button>
  );
});
