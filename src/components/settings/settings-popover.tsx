// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { Button } from "@/components/ui-primitives/button";
import { ScrollArea } from "@/components/ui-primitives/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui-primitives/sheet";

interface SettingsPopoverProps {
  /** Screen reader label for the trigger button */
  label: string;
  /** Optional className for the trigger button */
  className?: string;
  /** Content to render inside the sheet */
  children: React.ReactNode;
}

export function SettingsPopover({
  label,
  className,
  children,
}: SettingsPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={className}
            aria-label={label}
          >
            <IconAdjustmentsHorizontal />
          </Button>
        }
      />
      <SheetContent side="right" className="@container flex flex-col gap-0 p-0">
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1" viewportClassName="pe-3">
          <div className="space-y-6 px-2 py-5 @sm:px-4">{children}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
