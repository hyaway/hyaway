import { forwardRef } from "react";
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
  /** Visual variant */
  variant?: "default" | "destructive";
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional className */
  className?: string;
  /** Custom render element (e.g., anchor tag for links) */
  render?: ReactElement;
}

export const BottomNavButton = forwardRef<
  HTMLButtonElement,
  BottomNavButtonProps
>(function BottomNavButton(
  {
    label,
    icon,
    onClick,
    variant = "default",
    isLoading,
    disabled,
    className,
    render,
  },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="xl"
      onClick={onClick}
      className={cn(
        "h-full flex-col items-center justify-center gap-0.5 border-none px-3",
        "@xl:flex-row @xl:gap-1.5 @xl:px-4",
        "short:gap-0 short:px-3",
        "short:@xl:flex-row short:@xl:gap-1.5 short:@xl:px-4",
        "transition-[gap,padding] duration-200",
        variant === "destructive" && "text-destructive hover:text-destructive",
        className,
      )}
      disabled={disabled || isLoading}
      render={render}
    >
      {isLoading ? (
        <Spinner className="short:size-5 size-6" />
      ) : (
        <span className="short:size-5 short:[&>svg]:size-5 relative flex size-6 items-center justify-center [&>svg]:size-6">
          {icon}
        </span>
      )}
      <span className="short:sr-only short:@xl:not-sr-only text-xs @xl:text-sm">
        {label}
      </span>
    </Button>
  );
});
