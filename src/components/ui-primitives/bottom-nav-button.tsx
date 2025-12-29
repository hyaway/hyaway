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
        "h-10 flex-col items-center gap-0 px-3 sm:h-14 sm:gap-1 sm:px-6",
        "max-h-short:h-10 max-h-short:gap-0 max-h-short:px-3",
        className,
      )}
      disabled={disabled || isLoading}
      render={render}
    >
      {isLoading ? (
        <Spinner className="size-5 sm:size-6 max-h-short:size-5" />
      ) : (
        <span className="[&>svg]:size-5 sm:[&>svg]:size-6 max-h-short:[&>svg]:size-5">
          {icon}
        </span>
      )}
      <span className="sr-only text-xs sm:not-sr-only sm:inline sm:text-base max-h-short:sr-only">
        {label}
      </span>
    </Button>
  );
}
