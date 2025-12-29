import { cn } from "@/lib/utils";

interface FloatingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const sharedClasses = cn(
  "bg-background/80 max-h-short:px-2 max-h-short:py-0.5 fixed inset-x-0 bottom-0 z-40 items-center justify-between border-t px-2 py-0.5 backdrop-blur-sm sm:px-4 sm:py-1",
);

export function FloatingBar({
  children,
  className,
  ...props
}: FloatingBarProps) {
  return (
    <>
      {/* Mobile - no sidebar offset, no transition */}
      <div
        className={cn(sharedClasses, "flex md:hidden", className)}
        {...props}
      >
        {children}
      </div>
      {/* Desktop - sidebar-aware with transition */}
      <div
        className={cn(
          sharedClasses,
          "hidden md:left-(--sidebar-width) md:flex md:group-data-[state=collapsed]/sidebar-wrapper:left-(--sidebar-width-icon)",
          "transition-[left] duration-200 ease-linear",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}
