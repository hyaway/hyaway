import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui-primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";

interface SettingsPopoverProps {
  /** Screen reader label for the trigger button */
  label: string;
  /** Optional className for the trigger button */
  className?: string;
  /** Content to render inside the popover */
  children: React.ReactNode;
}

export function SettingsPopover({
  label,
  className,
  children,
}: SettingsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className={className}>
            <AdjustmentsHorizontalIcon />
            <span className="sr-only">{label}</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        {children}
      </PopoverContent>
    </Popover>
  );
}
