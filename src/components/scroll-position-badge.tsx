import { Badge } from "@/components/ui-primitives/badge";
import { cn } from "@/lib/utils";

export interface ScrollPositionBadgeProps {
  /** Current position (1-based display) */
  current: number;
  /** Number of items currently loaded (for infinite scroll scenarios) */
  loaded: number;
  /** Total number of items */
  total: number;
  /** Whether the container is currently scrolling */
  isScrolling: boolean;
  /** Whether to show the badge */
  show?: boolean;
}

export function ScrollPositionBadge({
  current,
  loaded,
  total,
  isScrolling,
  show = true,
}: ScrollPositionBadgeProps) {
  if (!show) {
    return null;
  }

  // Only show loaded/total if they differ (infinite scroll case)
  const countDisplay =
    loaded !== total ? `${loaded} (${total})` : String(total);

  return (
    <div className="pointer-events-none sticky bottom-14 z-50 mt-4 flex justify-self-end">
      <Badge
        className={cn(
          "pointer-events-auto transition-opacity",
          isScrolling
            ? "opacity-90 delay-0 duration-100"
            : "opacity-50 delay-100 duration-500",
        )}
        variant="secondary"
        size="xs"
      >
        {current}/{countDisplay}
      </Badge>
    </div>
  );
}
