import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface FloatingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const sharedClasses = cn(
  "bg-background/95 supports-backdrop-filter:bg-background/75 short:px-2 fixed inset-x-0 bottom-0 z-40 items-center justify-between border-t px-2 py-0 backdrop-blur-sm sm:px-4",
  // Extended area above bar for hover detection - always interactive
  "before:pointer-events-auto before:absolute before:inset-x-0 before:bottom-full before:content-['']",
  // Hover/focus brings bar back
  "hover:pointer-events-auto hover:translate-y-0 hover:opacity-100",
  "focus-within:pointer-events-auto focus-within:translate-y-0 focus-within:opacity-100",
);

export function FloatingBar({
  children,
  className,
  ...props
}: FloatingBarProps) {
  const isVisible = useScrollDirection(50);

  const visibilityClasses = isVisible
    ? "translate-y-0 opacity-100 before:h-2"
    : "pointer-events-none translate-y-full opacity-0 before:h-14 sm:before:h-12 short:before:h-10 hover:pointer-events-auto hover:translate-y-0 hover:opacity-100";

  return (
    <>
      {/* Mobile - no sidebar offset */}
      <div
        className={cn(
          sharedClasses,
          visibilityClasses,
          "flex transition-all duration-200 ease-out md:hidden",
          className,
        )}
        {...props}
      >
        {children}
      </div>
      {/* Desktop - sidebar-aware with sidebar transition */}
      <div
        className={cn(
          sharedClasses,
          visibilityClasses,
          "hidden md:left-(--sidebar-width) md:flex md:[transition:translate_200ms_ease-out,opacity_200ms_ease-out,left_200ms_linear] md:group-data-[state=collapsed]/sidebar-wrapper:left-(--sidebar-width-icon)",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}
