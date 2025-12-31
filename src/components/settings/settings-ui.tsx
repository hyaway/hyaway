import { cn } from "@/lib/utils";

export function SettingsHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="settings-header"
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props}
    />
  );
}

export function SettingsTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="settings-title"
      className={cn("text-base font-medium", className)}
      {...props}
    />
  );
}
