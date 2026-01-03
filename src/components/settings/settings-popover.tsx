import { useRef, useState } from "react";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui-primitives/drawer";
import { Popover, PopoverContent } from "@/components/ui-primitives/popover";
import { ScrollArea } from "@/components/ui-primitives/scroll-area";
import { useMediaQuery } from "@/hooks/use-media-query";

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

  // Use popover when there's sufficient width AND height, drawer otherwise
  const usePopover = useMediaQuery(
    "(min-width: 640px) and (min-height: 500px)",
  );

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
        if (usePopover && Date.now() - lastClosedRef.current < 100) {
          return;
        }
        setOpen(!open);
      }}
    />
  );

  // Default to popover until we know for sure (avoid flash)
  if (usePopover === false) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
        <DrawerTrigger render={button} />
        <DrawerContent>
          <ScrollArea viewportClassName="max-h-[60vh]">
            <div className="flex flex-col gap-4 px-5 pb-5">{children}</div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <>
      {button}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverContent
          anchor={anchorEl}
          align="end"
          className="w-90 p-0"
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
