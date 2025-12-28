import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted animate-pulse rounded-xl opacity-0 delay-500",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
