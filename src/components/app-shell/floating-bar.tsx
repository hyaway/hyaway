import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface FloatingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const sharedClasses = cn(
  "bg-background/95 supports-backdrop-filter:bg-background/75 max-h-short:px-2 fixed inset-x-0 bottom-0 z-40 items-center justify-between border-t px-2 py-0 backdrop-blur-sm sm:px-4",
);

export function FloatingBar({
  children,
  className,
  ...props
}: FloatingBarProps) {
  const isVisible = useScrollDirection(50);

  const visibilityClasses = isVisible
    ? "translate-y-0 opacity-100"
    : "pointer-events-none translate-y-full opacity-0";

  return (
    <>
      {/* Mobile - no sidebar offset */}
      <div
        className={cn(
          sharedClasses,
          visibilityClasses,
          "flex transition-all duration-300 ease-out md:hidden",
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
          "hidden md:left-(--sidebar-width) md:flex md:[transition:translate_300ms_ease-out,opacity_300ms_ease-out,left_200ms_linear] md:group-data-[state=collapsed]/sidebar-wrapper:left-(--sidebar-width-icon)",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}
