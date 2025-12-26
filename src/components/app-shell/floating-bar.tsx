import { cn } from "@/lib/utils";

interface FloatingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FloatingBar({ children, className, ...props }: FloatingBarProps) {
  return (
    <div
      className={cn(
        "bg-background/80 fixed right-0 bottom-0 z-40 border-t backdrop-blur-sm",
        "flex items-center justify-between px-4 py-2",
        "transition-[left] duration-200 ease-linear",
        "left-0 md:left-(--sidebar-width) md:group-data-[state=collapsed]/sidebar-wrapper:left-(--sidebar-width-icon)",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
