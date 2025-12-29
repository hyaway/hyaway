import { useState } from "react";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui-primitives/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
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
  // Use popover when there's sufficient width AND height, drawer otherwise
  const usePopover = useMediaQuery(
    "(min-width: 640px) and (min-height: 500px)",
  );

  const trigger = (
    <BottomNavButton
      label={label}
      icon={<AdjustmentsHorizontalIcon className="size-6" />}
      className={className}
    />
  );

  // Default to popover until we know for sure (avoid flash)
  if (usePopover === false) {
    return (
      <Drawer open={open} onOpenChange={setOpen} direction="bottom">
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <ScrollArea viewportClassName="max-h-[60vh]">
            <div className="flex flex-col gap-4 px-6 pb-6">{children}</div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className="w-80" side="top" sideOffset={8}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
