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
      className={cn("flex-col items-center gap-1", className)}
      disabled={disabled || isLoading}
      render={render}
    >
      {isLoading ? <Spinner className="size-6" /> : icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
