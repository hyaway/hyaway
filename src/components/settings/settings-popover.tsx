import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui-primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import { cn } from "@/lib/utils";

interface SettingsPopoverProps {
  /** Screen reader label for the trigger button */
  label: string;
  /** Optional className for the trigger button */
  className?: string;
  /** Content to render inside the popover */
  children: React.ReactNode;
  /** Use large button style matching floating bar actions */
  size?: "default" | "xl";
}

export function SettingsPopover({
  label,
  className,
  children,
  size = "default",
}: SettingsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          size === "xl" ? (
            <Button
              variant="ghost"
              size="xl"
              className={cn("relative flex-col items-center gap-1", className)}
            >
              <AdjustmentsHorizontalIcon className="size-6" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className={className}>
              <AdjustmentsHorizontalIcon />
              <span className="sr-only">{label}</span>
            </Button>
          )
        }
      />
      <PopoverContent align="end" className="w-80">
        {children}
      </PopoverContent>
    </Popover>
  );
}
