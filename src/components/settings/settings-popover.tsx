import { useRef, useState } from "react";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import { Popover, PopoverContent } from "@/components/ui-primitives/popover";
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
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  // Track when popover was last closed to prevent immediate reopen
  const lastClosedRef = useRef(0);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      lastClosedRef.current = Date.now();
    }
    setOpen(nextOpen);
  };

  // Always render the button with a ref for anchoring
  const button = (
    <BottomNavButton
      ref={setAnchorEl}
      label={label}
      icon={<IconAdjustmentsHorizontal className="size-6" />}
      className={className}
      onClick={() => {
        // If popover was just closed (within 100ms), don't reopen
        // This handles the case where clicking the button triggers both
        // the outside-click close and the button click
        if (Date.now() - lastClosedRef.current < 100) {
          return;
        }
        setOpen(!open);
      }}
    />
  );

  return (
    <>
      {button}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverContent
          anchor={anchorEl}
          align="end"
          className="w-svw p-0 sm:w-90"
          side="top"
          sideOffset={8}
        >
          <ScrollArea viewportClassName="max-h-[calc(95svh-var(--footer-height)-1.5rem)]">
            <div className="p-5">{children}</div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
