import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface FloatingFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FloatingFooter({
  children,
  className,
  ...props
}: FloatingFooterProps) {
  const isVisible = useScrollDirection(50);

  const visibilityClasses = isVisible
    ? "translate-y-0 opacity-100 before:h-2"
    : "pointer-events-none translate-y-full opacity-0 before:h-(--footer-height) sm:before:h-(--footer-height-sm) short:before:h-(--footer-height-short) hover:pointer-events-auto hover:translate-y-0 hover:opacity-100";

  return (
    <div
      className={cn(
        "bg-background/95 supports-backdrop-filter:bg-background/75 short:px-2 @container sticky bottom-0 z-40 flex items-center justify-between border-t px-2 backdrop-blur-sm sm:px-4",
        "short:h-(--footer-height-short) h-(--footer-height) @lg:h-(--footer-height-sm)",
        // Extended area above bar for hover detection
        "before:pointer-events-auto before:absolute before:inset-x-0 before:bottom-full before:content-['']",
        // Hover/focus brings bar back
        "hover:pointer-events-auto hover:translate-y-0 hover:opacity-100",
        "focus-within:pointer-events-auto focus-within:translate-y-0 focus-within:opacity-100",
        // Visibility transition (includes height for reflow animation)
        "transition-[translate,opacity,height] duration-200",
        visibilityClasses,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
