import type { ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui-primitives/button";
import { Spinner } from "@/components/ui-primitives/spinner";
import { cn } from "@/lib/utils";

interface BottomNavButtonProps {
  /** The label for the button */
  label: string;
  /** Icon content to display */
  icon: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional className */
  className?: string;
  /** Custom render element (e.g., anchor tag for links) */
  render?: ReactElement;
}

export function BottomNavButton({
  label,
  icon,
  onClick,
  isLoading,
  disabled,
  className,
  render,
}: BottomNavButtonProps) {
  return (
    <Button
      variant="ghost"
      size="xl"
      onClick={onClick}
      className={cn(
        "h-auto flex-col items-center gap-0.5 px-3 py-1 sm:gap-1 sm:px-5 sm:py-2",
        "max-h-short:gap-0 max-h-short:px-3 max-h-short:py-1",
        "short-wide:flex-row short-wide:gap-1.5 short-wide:px-4",
        className,
      )}
      disabled={disabled || isLoading}
      render={render}
    >
      {isLoading ? (
        <Spinner className="max-h-short:size-5 size-6" />
      ) : (
        <span className="max-h-short:size-5 max-h-short:[&>svg]:size-5 relative flex size-6 items-center justify-center [&>svg]:size-6">
          {icon}
        </span>
      )}
      <span className="max-h-short:sr-only short-wide:not-sr-only short-wide:text-sm text-xs sm:text-base">
        {label}
      </span>
    </Button>
  );
}
