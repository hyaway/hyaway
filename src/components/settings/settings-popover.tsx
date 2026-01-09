import { useRef, useState } from "react";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { Button } from "@/components/ui-primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import { ScrollArea } from "@/components/ui-primitives/scroll-area";

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
  const [open, setOpen] = useState(false);
  // Track when popover was last closed to prevent immediate reopen
  const lastClosedRef = useRef(0);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      lastClosedRef.current = Date.now();
    }
    setOpen(nextOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={className}
            aria-label={label}
            onClick={() => {
              // If popover was just closed (within 100ms), don't reopen
              // This handles the case where clicking the button triggers both
              // the outside-click close and the button click
              if (Date.now() - lastClosedRef.current < 100) {
                return;
              }
              setOpen(!open);
            }}
          >
            <IconAdjustmentsHorizontal className="size-5" />
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-90 max-w-[90svw] p-0"
        side="bottom"
        sideOffset={8}
      >
        <ScrollArea viewportClassName="max-h-[calc(95svh-var(--header-height)-1.5rem)]">
          <div className="p-5">{children}</div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
