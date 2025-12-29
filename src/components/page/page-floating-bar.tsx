import { FloatingBar } from "@/components/app-shell/floating-bar";
import { cn } from "@/lib/utils";

interface PageFloatingBarProps {
  /** Actions to display on the left side (primary actions like shuffle, refetch) */
  leftActions?: React.ReactNode;
  /** Actions to display on the right side (typically settings popover) */
  rightActions?: React.ReactNode;
  /** Optional className for the floating bar */
  className?: string;
}

export function PageFloatingBar({
  leftActions,
  rightActions,
  className,
}: PageFloatingBarProps) {
  return (
    <FloatingBar className={cn("gap-2", className)}>
      <div className="flex items-center gap-2">{leftActions}</div>
      <div className="flex items-center gap-2">{rightActions}</div>
    </FloatingBar>
  );
}
